## Background

Suppose we have `Provider`, `Instance 0` ( `LB`, `NGINX`, `BM Router` ) and `Instanse 1` ( `DFM`, `DEV`, `DEP`, `DFC` ). `DFM` is configured to notify `LB` about overload ( total CPU usage for defined time, for all components; also in the notification `DFM` sends info about CPU usage per process, so the `LB` can understand what process is overloaded ), `NGINX` picks up statistic about quantity of requests per tenant. From all this statistic (`DFM` and `NGINX`) `LB` knows what tenants are active for the moment and causes the overload.

If `BM Router` receives request to create/remove a tenant, it sends the request to `NGINX`, then `NGINX` proxies it to `DEV` of appropriate instance.

### Scenario 1 ( normal flow )

1. `NGINX` receives requests from `the Internet`, proxies all of them to `DEV`/`DEP` of `Instance 1`

### Scenario 2 ( overload of Instance )

1. `DFM` send the notification to `LB` (see above).
1. `LB` asks `NGINX` for statistic,
1. `LB` defines what tenants caused the overload.
1. `LB` sends request to `Provider` to create new instance.
1. When the new `Instance` is created and started ( only `DFM` is up there for now ):
    1. `LB` sends request to the `Instance`s `DFM` to start required components ( for example `DEV` ), with configuration ( what tenants it should operate )
    1. `DFM` starts the components, and response to `LB` when it is done
1. `LB` changes configuration of `NGINX`, so from now it will proxy requests to both `Instance 1` and `Instance 2` depending of tenant


### Scenario 3 ( low loaded Instance )

1. `DFM` of `Instance 2` send notification to `LB` about defined low load for defined time.
1. `LB` changes configuration of `NGINX`, it will proxy requests to `Instance 1` only
1. `LB` sends request to `DFM` of `Instance 2` to stop all components (gracefull shutdown — active requests will be finished before the shutdown).
1. the `DFM` sends request to `LB` when the components are shutdowned.
1. `LB` sends request to `Provider` to remove `Instance 2`.

### Scenario 4 ( `DEV`/`DEP` are broken )

1. `DFM` see that a component process is down
1. `DFM` sends notification to `LB`
1. `LB` changes `NGINX` configuration
1. `DFM` restarts the component
1. `NGINX` proxies requests according new configuration to another `Instance`
1. `DFM` notifies `LB` that the component is up
1. `LB` changes `NGINX` configuration back, so it proxies requests to the restarted component


### Scenario 5 ( `Instance` is broken )

1. `NGINX` sends notification to `LB` that requests to the `Instance` are dropped
1. `LB` changes `NGINX` configuration
1. `NGINX` proxies requests according new configuration to another `Instance`
1. `LB` send API request to `Provider` to restart the `Instance`
1. `LB` changes `NGINX` configuration back, so it proxies requests to the restarted `Instance`
