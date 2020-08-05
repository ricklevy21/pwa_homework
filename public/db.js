const request = window.indexedDB.open("budget", 1);

request.onupgradeneeded = function(event) {
    // create object store
    //object store is analagous to a table/colleciton in a db.
    //in this app, I am using it to store all pending transactions that are part of the budget "db"
   const db = event.target.result;
   db.createObjectStore("pendingTransactions", { autoIncrement: true });
 };

request.onsuccess = event => {
    console.log("success!")
    console.log(request.result)
};