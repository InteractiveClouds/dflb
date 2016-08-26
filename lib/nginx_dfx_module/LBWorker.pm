package LBWorker;

use strict;
use warnings;
no  warnings 'uninitialized';

use Sys::Hostname;
use IO::Socket::INET;
use Nginx;

my %tenant_map;

sub init_worker {

    my $filename = '/var/lib/dreamface/lbdata/tenants.map';
    if (open(my $fh, '<:encoding(UTF-8)', $filename)) {
        while (my $row = <$fh>) {
            chomp($row);
            if ( $row=~/^([^=]+)=([^=]+)/ ) {
                my $tenant = $1;
                my $url = "http://$2:3000";
                $tenant_map{$tenant} = $url;
            } else {
                warn "ERROR [TENANTS_MAP_PARSER] unknown format of tenants map line: $row\n";
            }
        }
        my $hasAnyKey = 0;
        foreach my $tenant ( keys %tenant_map ) {
            $hasAnyKey = 1;
            warn "INFO  [TENANTS_MAP_PARSER] mapped tenant \"$tenant\" \t to server \"$tenant_map{$tenant}\"\n";
        }
        warn "WARN  [TENANTS_MAP_PARSER] no map rules was found\n" if ( !$hasAnyKey );
    } else {
        warn "ERROR [TENANTS_MAP_PARSER] Could parse TENANTS MAP, cause could not open it\'s file '$filename' $!";
    }
}


sub define_target {
    my ($r) = @_;
    my $tenant = $r->variable("cookie_X-DREAMFACE-TENANT") || "*";
    my $server = $tenant_map{$tenant} || $tenant_map{"*"} || 0;

    $r->header_out("X-DEFINED-DREAMFACE-TENANT", $tenant);
    $r->variable("dfx_target_instance", $server) if ( $server );
    
    $r->phase_handler_inc;
    $r->core_run_phases;

    return NGX_DONE;
}
#4335
1;
