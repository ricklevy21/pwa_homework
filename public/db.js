let db;

//define a variable called request. This request creates an indexedDB on the browser (window) and opens it. in this case it is called budget.
const request = window.indexedDB.open("budget", 1);

//should htere be a change to the schema (added an object store, changed the object store), the version, which is referred to after the name of the db, should be incremented.
//in the case of a new version, the code below is run. here is creates/adds the object store.
request.onupgradeneeded = function(event) {
    // create object store
    //object store is analagous to a table/colleciton in a db.
    //in this app, I am using it to store all pending transactions that are part of the budget "db"
    //set the db variable to the result, so I can add the object store to that db
   const db = event.target.result;
   db.createObjectStore("pendingTransactions", { autoIncrement: true });
 }

 request.onsuccess = event => {
    //when or if the request to make the indexedDB is successfull, execute this code
    db = event.target.result;
    if (navigator.onLine) {
        checkDatabase()
    }
}

request.onerror = event => {
    console.log("There was an error: " + event.target.errorCode);
}

function saveRecord(record) {
    //we have lost connection
    //create a transaction record on the indexedDB, with readwrite access
    //go the the database, create a transaction. transaction method takes in 2 parameters: the object stor in the form of an array (in case there are multiple) and what you want to do with it, in this case give it read and write access, to read/write from/to the db
    const transaction = db.transaction(["pendingTransactions"], "readwrite")
    
    //access the pendingTransactioin object store
    const store = transaction.objectStore("pendingTransactions")

    //add record to the object store with the add method
    store.add(record)
}

//this function looks to see if there are any pending transactions that have been added while the app was offline
function checkDatabase() {
    //open a transaction on the pending db
    const transaction = db.transaction("pendingTransactions", "readwrite")
    //access the pendingTransactioin object store
    const store = transaction.objectStore("pendingTransactions")
    //get all of the records from the object store and set to a variable. use the getAll method.
    const getAll = store.getAll()

    //once we have successfully gotten all the records from the object store,
    //check if there are any records (length > 0),
    //then via a front-end API fetch, invoke the POST route (mongoose insertMany) on the server that adds the records to the mongodb that lives on the server
    getAll.onsuccess = function () {
        fetch("/api/transaction/bulk", {
            method: "POST",
            body: JSON.stringify(getAll.result),
            headers: {
                Accept: "application/json, text/plain, */*",
                "Content-Type": "application/json"
            }
        })
            .then(response => response.json())
            .then(() => {
                //because we successfully added all records from the objectstore to the mongodb, we can now clear out the objectstore/indexedDB
                    //open a transaction on the pending db
                    const transaction = db.transaction("pendingTransactions", "readwrite")
                    //access the pendingTransactioin object store
                    const store = transaction.objectStore("pendingTransactions")
                    //clear out the objectstore
                    store.clear()

            })
    }

}

//listen for the applicaiton coming back online
//when the app is back online, run the function checkDatabase
window.addEventListener("online", checkDatabase)