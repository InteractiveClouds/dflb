package LBWorker;

use strict;
use warnings;
no  warnings 'uninitialized';

use Sys::Hostname;
use IO::Socket::INET;
use Nginx;
use Time::HiRes qw(usleep);

my $STAT_SERVER_ADDR = '127.0.0.1';
my $STAT_SERVER_PORT = 40008;
my $lastflush, $socket;
my %tenant_map = (
    'dev' => {},
    'dep' => {},
    'dfc' => {}
);

sub init_worker {


    my $filename = './tenants.map';
    my $hasErrors = 0;
    if (open(my $fh, '<:encoding(UTF-8)', $filename)) {
        my $current_cname;
        my $line_counter = 0;
        my %defined_cnames = (
            'dev' => 0,
            'dep' => 0,
            'dfc' => 0
        );
        while (my $row = <$fh>) {
            $line_counter++;
            chomp($row);
            if ( $row=~/^([^=]+)=([^=]+)/ ) {
                my $tenant = $1;
                my $url = $2;
                if ( !$current_cname ) {
                    warn"ERROR [TENANTS_MAP_PARSER] component was not defined. At line $line_counter\n";
                    $hasErrors = 1;
                }
                $tenant_map{$current_cname}{$tenant} = $url;
            } else {
                if ( $row=~/^(dev|dep|dfc)$/ ) {
                    my $cname = $1;
                    if ( $defined_cnames{$cname} ) {
                        warn"ERROR [TENANTS_MAP_PARSER] component $cname was defined already. At line $line_counter\n";
                        $hasErrors = 1;
                    }
                    $defined_cnames{$cname} = 1;
                    $current_cname = $cname;
                }   else {
                    warn "ERROR [TENANTS_MAP_PARSER] unknown format of tenants map. At line $line_counter\n";
                    $hasErrors = 1;
                }
            }
        }
        foreach my $component ( keys %tenant_map ) {
            my $hasAnyKey = 0;
            foreach my $tenant ( keys %{$tenant_map{$component}} ) {
                $hasAnyKey = 1;
                warn "INFO  [TENANTS_MAP_PARSER] for component \"$component\", tenant \"$tenant\" \t is mapped to server \"$tenant_map{$component}{$tenant}\"\n";
            }
            if ( !$hasAnyKey ) {
                warn "WARN  [TENANTS_MAP_PARSER] no map rules was found for component \"$component\"\n";
                $hasErrors = 1;
            }
        }
    } else {
        warn "ERROR [TENANTS_MAP_PARSER] Could parse TENANTS MAP, cause could not open it\'s file '$filename' $!";
        $hasErrors = 1;
    }
    $socket = IO::Socket::INET->new (
            PeerAddr => $STAT_SERVER_ADDR,
            PeerPort => $STAT_SERVER_PORT,
            Proto    => 'tcp',
            Type     => SOCK_STREAM
        ) || 0;
    if ( $socket ) {
        $socket->autoflush(0);
    } else {
        warn "ERROR [TENANTS_MAP_PARSER] can't connect the statistics server\n";
        $hasErrors = 1;
    }
    
    $lastflush = time;

    warn "FATAL [TENANTS_MAP_PARSER] worker is NOT initialized.\n" if ( $hasErrors );
}

sub sendStatistic ($$$$) {
    return if ( !$socket );
    my $server = shield(shift);
    my $cname  = shield(shift);
    my $tenant = shield(shift);
    my $url    = shield(shift);
    my $data = "${server}::${cname}::${tenant}::${url}||";
    my $now = time;
    print $socket "$data";
    if ( $now > $lastflush + 3 ) {
        $lastflush = $now;
        $socket->flush();
    }
}

sub shield {
    $_ = shift;
    s/:/\\:/g;
    s/\|/\\\|/g;
    return $_;
}


sub on_request {
    my ($r) = @_;
    my $tenant    = $r->variable("cookie_X-DREAMFACE-TENANT") || "*";
    my $component = $r->variable("dfx_component");
    my $server    = $tenant_map{$component}{$tenant} || $tenant_map{$component}{"*"} || 0;
    my $uri       = $r->variable("request_uri");

    sendStatistic($server, $component, $tenant, $uri);

    $r->header_out("X-DEFINED-DREAMFACE-TENANT", $tenant);
    $r->variable("dfx_target_instance", $server) if ( $server );
    
    $r->phase_handler_inc;
    $r->core_run_phases;

    return NGX_DONE;
}
1;
