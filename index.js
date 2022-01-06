const fs = require("fs").promises
const Table = require('./table');

// TODO: Add JSDoc annotations

class MemDB {
    static Table = Table;

    constructor(...tables) {
        // Each table is an object with a name string and (optionally) a data array.
        this.tables = tables.map(table => new Table(table.name, table));
        this.tables.forEach(table => this._createTable(table));
    }

    _createTable(table) {
        Object.defineProperties(this, table.name, {
            configurable: false,
            enumerable: true,
            writable: false,
            value: table
        })
    }

    toJSON() {
        const data = this.tables.reduce((data, table) => {
            data[table.name] = table.data;
            return data;
        }, {})
        return data;
    }

    static fromJSON(data) {
        const tables = Object.entries(data).map(([name, tableData]) => new Table(name, { data: tableData }));
        return new MemDB(...tables);
    }

    save(file, format = false) {
        return fs.writeFile(file, JSON.stringify(this.toJSON(), null, format ? 2 : 0));
    }

    saveSync(file, format = false) {
        fs.writeFileSync(file, JSON.stringify(this.toJSON(), null, format ? 2 : 0));
    }

    load(file) {
        return fs.readFile(file).then(data => MemDB.fromJSON(JSON.parse(data)));
    }

    loadSync(file) {
        return MemDB.fromJSON(JSON.parse(fs.readFileSync(file)));
    }
}

module.exports = MemDB;