const fs = require('fs').promises

// TODO list:
// - add a keys argument, allowing the user to specify the keys of the table, defaults, and custom primary keys

/**
 * A function used in find and filter to determine if a row should be included in the result. It should return true if the row should be included, false otherwise.
 * @typedef {Function} WHERE
 * @param {Object} row
 * @param {number} index
 * @param {Array} table
 * @returns {boolean}
 * @example
 * const table = new Table('users', {data: [{name: 'John', age: 20}, {name: 'Jane', age: 21}]});
 * const myWhere = (row, index, table) => row.age > 20;
 * table.findOne(myWhere); // {name: 'Jane', age: 21}
 */

/**
 * @class Table
 * @classdesc A class that represents a table in a database.
 * @example
 * const table = new Table('users')
 * table.insert({ name: 'John', age: 25 }) // => { id: 1, name: 'John', age: 25 }
 * table.insert({ name: 'Jane', age: 24 }) // => { id: 2, name: 'Jane', age: 24 }
 * table.get(1) // => { id: 1, name: 'John', age: 25 }
 * table.getWhere(user => user.name === "John") // => [{ id: 1, name: 'John', age: 25 }]
 * table.getWhere(user => user.age > 20) // => [{ id: 1, name: 'John', age: 25 }, { id: 2, name: 'Jane', age: 24 }]
 * table.save('users.json') // => Promise
 * table.saveSync('users.json')
 * table.load('users.json') // => Promise => Table
 * table.loadSync('users.json') // => Table
 */
class Table {
    /**
     * Create a new {@link Table}.
     * @constructor
     * @param {string} name - The name of the table.
     * @param {object} [options] - An object containing the following properties:
     * @param {array} [options.data] - An array of objects representing the rows in the table. 
     * @see {@link Table}
     */
    constructor(name, { data = [] } = {}) {
        this.name = name;
        this.data = data;
    }

    /**
     * Get the number of items in the table.
     * @memberof Table
     * @returns {number} The number of items in the table.
     */
    get count() {
        return this.data.length;
    }

    /**
     * Return a boolean indicating whether the table is empty.
     * @memeberof Table
     * @returns {boolean} True if the table is empty, false otherwise.
     */
    get isEmpty() {
        return this.count === 0;
    }

    /**
     * Returns all the keys used by objects in the table, like those that would be defined with SQL.
     * @memberof Table
     * @returns {array} An array of strings representing the keys used by objects in the table.
     */
    get keys() {
        return this.isEmpty ? ["id"] : Object.keys(this.data[0]);
    }

    /* ---------- Utility Methods ---------- */

    /**
     * Find the first item in the table that matches the given WHERE function.
     * @param {WHERE} whereFunction - A function that returns true if the item matches the criteria.
     * @returns {object} The first item in the table that matches the given WHERE function.
     */
    findOne(whereFunction) {
        return this.data.find(whereFunction);
    }

    /**
     * Find all the items in the table that match the given WHERE function.
     * @param {WHERE} whereFunction - A function that returns true if the item matches the criteria.
     * @returns {array} An array of items that match the given WHERE function.
     */
    findMany(whereFunction) {
        return this.data.filter(whereFunction);
    }

    /**
     * Return all the rows in the table.
     * @returns {array} An array of objects representing the rows in the table.
     */
    all() {
        return this.data;
    }

    /**
     * Generate a new id for the table. Each id is one greater than the previous id. IDs start at 1.
     * @returns {number} The next id for the table.
     */
    nextId() {
        if (this.isEmpty) return 1
        return Array.at(this.data, -1).id + 1;
    }

    /**
     * Create a new table by applying the given function to each item in the table.
     * @param {function} mapFunction - A function that takes an item and returns a new item.
     * @returns {Table} A new table with the results of applying the given function to each item in the table.
     */
    map(mapFunction) {
        return new Table(this.name, { data: this.data.map(mapFunction) });
    }

    /**
     * Create a new table that only includes items that match the given WHERE function.
     * @param {WHERE} whereFunction - A function that returns true if the item matches the criteria.
     * @returns {Table} A new table that only includes items that match the given WHERE function.
     */
    filter(whereFunction) {
        return new Table(this.name, { data: this.data.filter(filterFunction) });
    }

    /**
     * Sorts all the items in the table by the given key, or by id.
     * @param {string} [key] - The key to sort by. Defaults to id.
     * @param {Function} [sortFunction] - A function that takes two items and returns -1, 0, or 1. Defaults to ascending order.
     * @returns {Table} A new table with the items sorted by the given key.
     */
    sort(key = "id", sortFn = (a, b) => a - b) {
        this.data = this.data.sort((a, b) => sortFn(a[key], b[key]));
        return this
    }

    /* ---------- CRUD Methods ---------- */

    /**
     * Select one item from the table that with the given id.
     * @param {number} id - The id of the item to select.
     * @returns {object|null} The item with the given id, or null if no item with the given id exists.
     */
    get(id) {
        return this.findOne(item => item.id === id);
    }

    /**
     * Select all items from the table that match the given WHERE function.
     * @param {WHERE} whereFunction - A function that returns true if the item matches the criteria.
     * @returns {array} An array of items that match the given WHERE function.
     */
    getWhere(whereFunction) {
        return this.findMany(whereFunction);
    }

    /**
     * Insert an item into the table.
     * @param {object} item - The item to insert.
     * @returns {object} The inserted item.
     */
    insert(item) {
        const newItem = { id: this.nextId(), ...item };
        this.data.push(newItem);
        return newItem;
    }

    /**
     * Update an item in the table by id.
     * @param {number} id - The id of the item to update.
     * @param {object} updateObject - The object containing the updates to apply to the item.
     * @returns {object|null} The updated item if it exists, or null if no item with the given id exists.
     */
    update(id, updateObject) {
        const item = this.get(id);
        if (!item) return null
        const index = this.data.indexOf(item);
        this.data[index] = { ...item, ...updateObject };
        return this.data[index];
    }

    /**
     * Updates all items in the table that match the given WHERE function.
     * @param {WHERE} whereFunction - A function that returns true if the item matches the criteria.
     * @param {object} updateObject - The object containing the updates to apply to the item.
     * @returns {array} An array of the updated items.
     */
    updateWhere(whereFunction, updateObject) {
        const items = this.findMany(whereFunction);
        items.forEach(item => {
            const index = this.data.indexOf(item);
            this.data[index] = { ...item, ...updateObject };
        });
        return items;
    }

    /**
     * Delete an item from the table by id.
     * @param {number} id - The id of the item to delete.
     * @returns {object|null} The deleted item if it exists, or null if no item with the given id exists.
     */
    delete(id) {
        const item = this.get(id);
        if (!item) return null
        const index = this.data.indexOf(item);
        this.data.splice(index, 1);
        return item;
    }

    /**
     * Delete all items from the table that match the given WHERE function.
     * @param {WHERE} whereFunction - A function that returns true if the item matches the criteria.
     * @returns {array} An array of the deleted items.
     */
    deleteWhere(whereFunction) {
        const items = this.findMany(whereFunction);
        items.forEach(item => {
            const index = this.data.indexOf(item);
            this.data.splice(index, 1);
        });
        return items;
    }

    /** Delete all items from the table. */
    clear() {
        this.data = [];
    }

    /**
     * Returns a string representation of the table.
     * @returns {string} A string representation of the table.
     * @override
     */
    toString() {
        return `Table<${this.name}, (${this.keys.join(", ")})>`
    }

    /* ---------- Persist Methods ---------- */

    /**
     * Convert the table to a JSON string.
     * @returns {string} A JSON string representing the table.
     * @see {@link fromJSON}
     */
    toJSON(format = false) {
        return JSON.stringify(this.data, null, format ? 2 : 0);
    }

    /**
     * Load the table from a JSON string.
     * @param {string} json - A JSON string representing the table.
     * @param {string} [name] - The name of the table. Defaults to "UNNAMED"
     * @returns {Table} A new table with the items from the JSON string.
     * @static
     * @see {@link toJSON}
     */
    static fromJSON(json, name = "UNNAMED") {
        return new Table(name, { data: JSON.parse(json) });
    }

    /**
     * Saves the data to a file asynchronously.
     * @param {string} file - The path to the file to save to.
     * @returns {Promise} A promise that resolves when the data is saved.
     * @see {@link saveSync}
     * @see {@link load}
     * @see {@link loadSync}
     */
    save(file) {
        fs.writeFile(file, this.toJSON());
    }

    /**
     * Saves the data to a file synchronously.
     * @param {string} file - The path to the file to save to.
     * @returns {void}
     * @see {@link save}
     * @see {@link load}
     * @see {@link loadSync}
     */
    saveSync(file) {
        fs.writeFileSync(file, this.toJSON());
    }

    /**
     * Loads the data from a file asynchronously.
     * @param {string} file - The path to the file to load from.
     * @param {string} [name] - The name of the table. Defaults to to file name.
     * @returns {Promise} A promise that resolves when the data is loaded.
     * @static
     * @see {@link loadSync}
     * @see {@link save}
     * @see {@link saveSync}
     */
    static load(file, name = null) {
        name = name || file;
        return fs.readFile(file).then(data => Table.fromJSON(data, name));
    }

    /**
     * Loads the data from a file synchronously.
     * @param {string} file - The path to the file to load from.
     * @param {string} [name] - The name of the table. Defaults to to file name.
     * @returns {Table} A new table with the items from the JSON string.
     * @static
     * @see {@link load}
     * @see {@link save}
     * @see {@link saveSync}
     */
    static loadSync(file, name = null) {
        name = name || file;
        return Table.fromJSON(fs.readFileSync(file), name);
    }
}

module.exports = Table;
