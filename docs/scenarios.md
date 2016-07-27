Suppose we have `Provider`, `Instance 0` ( `LB`, `NGINX`, `BM Router` ) and `Instanse 1` ( `DFM`, `DEV`, `DEP`, `DFC` ). `DFM` is configured to notify `LB` about overload ( total CPU usage for defined time, for all components; also in the notification `DFM` sends info about CPU usage per process, so the `LB` can understand what process is overloaded ), `NGINX` picks up statistic about quantity of requests per tenant. From all this statistic (`DFM` and `NGINX`) `LB` knows what tenants are active for the moment and causes the overload.

If `BM Router` receives request to create/remove a tenant, it sends the request to `NGINX`, then `NGINX` proxies it to `DEV` of appropriate instance.

## Scenario 1 ( normal flow )

1) `NGINX` receives requests from `the Internet`, proxies all of them to `DEV`/`DEP` of `Instance 1`

## Scenario 2 ( overload of Instance )

1) `DFM` send the notification to `LB` (see above).
2) `LB` asks `NGINX` for statistic,
3) `LB` defines what tenants caused the overload.
4) `LB` sends request to `Provider` to create new instance.
5) When the new `Instance` is created and started ( only `DFM` is up there for now ):
    5.1) `LB` sends request to the `Instance`s `DFM` to start required components ( for example `DEV` ), with configuration ( what tenants it should operate )
    5.2) `DFM` starts the components
