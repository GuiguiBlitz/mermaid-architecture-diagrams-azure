# mermaid-architecture-diagrams-azure

To build the icon pack run `npm run buil-icons`

Run the editor with `npm run dev`


architecture-beta
    group api(cloud)[API]

    service db(azure:databases-azure-database-postgresql-server)[Database] in api
    service disk1(disk)[Storage] in api
    service disk2(disk)[Storage] in api
    service server(azure:databases-azure-database-postgresql-server)[Server] in api

    db:L -- R:server
    disk1:T -- B:server
    disk2:T -- B:db