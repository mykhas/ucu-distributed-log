This repo contains solution to the assignment from Distributed Systems course, held in UCU, Lviv as a part of a Data Engineering program.

## Setup

Note you should have Docker and Docker Compose installed locally.

``` bash
git clone git@github.com:mykhas/ucu-distributed-log.git
cd ucu-distributed-log
docker-compose stop
docker-compose rm -f
docker-compose build
docker-compose up -d
```

After executing the above, one will have primary node running on `9000` port, and two secondary nodes on `9001` and `9002`.

Please check branches `iteration-1`, `iteration-2` and `iteration-3` if you're interested in partial solutions.

## Testing

``` bash
curl --location --request POST 'http://localhost:9000/' \
--header 'Content-Type: application/json' \
--data-raw '{
    "message": "Hello",
    "w": 1
}'

curl --location --request GET 'http://localhost:9001'
```

- `message` stands for the new log entry;
- `w` stands for write concern value. `1` (or none) passed means that master node will not wait for the entry replication, `2` will wait for the replication to a single secondary node, and `3` will replicate to both before responding with a new list.

Artificial node delays can be set in `docker-compose.yml` file, using `DELAY` env variable for the secondary nodes.
