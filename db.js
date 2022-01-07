const fs = require("fs").promises
const Table = require('./table');

/**
 * An object that represents a table definition.
 * @typedef {Object} TableDefinition
 * @property {string} name - The name of the table.
 * @property {string[]} columns - The names of the columns in the table.
 */

/**
 * @class MemDB
 * @classdesc A class that represents a in-memory database with one or more tables.
 * @example
 * const db = new MemDB({ name: "users" }, { name: "posts" })
 * const john = db.users.insert({ name: "John" }) // => { id: 1, name: "John" }
 * db.posts.insert({ userId: 1, title: "Hello World" })
 * const johnsPosts = db.posts.getWhere(post => post.userId === john.id) // => [{ id: 1, userId: 1, title: "Hello World" }]
 */
class MemDB {
    /**
     * Create a new {@link MemDB} instance.
     * @constructor
     * @param {...TableDefinition} tables - The tables to create in the database.
     * @see {@link TableDefinition}
     * @see {@link Table}
     */
    constructor(...tables) {
        // Each table is an object with a name string and (optionally) a data array.
        this.tables = tables.map(table => new Table(table.name, table));
        this.tables.forEach(table => this._createTable(table));
    }

    /**
     * Define a property on the {@link MemDB} instance to access a table.
     * @param {Table} table - The table to define.
     * @private
     */
    _createTable(table) {
        Object.defineProperties(this, table.name, {
            configurable: false,
            enumerable: true,
            writable: false,
            value: table
        })
    }

    /**
     * Return a JSON representation of the database.
     * @returns {Object}
     */
    toJSON() {
        const data = this.tables.reduce((data, table) => {
            data[table.name] = table.data;
            return data;
        }, {})
        return data;
    }

    /**
     * Load the database from a JSON representation.
     * @param {Object} data - The JSON representation of the database.
     * @static
     * @returns {MemDB}
     * @see {@link MemDB#toJSON}
     */
    static fromJSON(data) {
        const tables = Object.entries(data).map(([name, tableData]) => new Table(name, { data: tableData }));
        return new MemDB(...tables);
    }

    /**
     * Save the database to a JSON file asynchronously.
     * @param {string} file - The path to the file to save to.
     * @returns {Promise}
     * @see {@link MemDB#saveSync}
     * @see {@link MemDB#load}
     * @see {@link MemDB#loadSync}
     */
    save(file, format = false) {
        return fs.writeFile(file, JSON.stringify(this.toJSON(), null, format ? 2 : 0));
    }

    /**
     * Save the database to a JSON file synchronously.
     * @param {string} file - The path to the file to save to.
     * @returns {Promise}
     * @see {@link MemDB#save}
     * @see {@link MemDB#load}
     * @see {@link MemDB#loadSync}
     */
    saveSync(file, format = false) {
        fs.writeFileSync(file, JSON.stringify(this.toJSON(), null, format ? 2 : 0));
    }

    /**
     * Load the database from a JSON file asynchronously.
     * @param {string} file - The path to the file to load from.
     * @returns {Promise<MemDB>}
     * @see {@link MemDB#loadSync}
     * @see {@link MemDB#save}
     * @see {@link MemDB#saveSync}
     */
    load(file) {
        return fs.readFile(file).then(data => MemDB.fromJSON(JSON.parse(data)));
    }

    /**
     * Load the database from a JSON file synchronously.
     * @param {string} file - The path to the file to load from.
     * @returns {MemDB}
     * @see {@link MemDB#load}
     * @see {@link MemDB#save}
     * @see {@link MemDB#saveSync}
     */
    loadSync(file) {
        return MemDB.fromJSON(JSON.parse(fs.readFileSync(file)));
    }
}

module.exports = MemDB;