class Nodo {
    constructor(id, name, host, port) {
        this.id = id;
        this.name = name;
        this.host = host;
        this.port = port;
    }

    getId() {
        return this.id;
    }

    getName() {
        return this.name;
    }

    getHost() {
        return this.host;
    }

    getPort() {
        return this.port;
    }
}

export default Nodo;