// reate variable to store IndexedDB connection
let db;

//establish connection to IndexedDB database
const request = indexedDB.open("pwa", 1);

//event will emit if the db version changes
request.onupgradeneeded = function (event) {
  //save ref to db
  const db = event.target.result;
  //create object store
  db.createObjectStore("new_transaction", { autoIncrement: true });
};

request.onsuccess = function (event) {
  // when db is successfully created with its object store (from onupgradedneeded event above), save reference to db in global variable
  db = event.target.result;

  // check if app is online, if yes run checkDatabase() function to send all local db data to api
  if (navigator.onLine) {
    uploadtransaction();
  }
};

request.onerror = function (event) {
  // log error here
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction(["new_transaction"], "readwrite");

  const transactionObjectStore = transaction.objectStore("new_transaction");

  // add record to your store with the add method.
  transactionObjectStore.add(record);
}

function uploadtransaction() {
  // open a transaction on your pending db
  const transaction = db.transaction(["new_transaction"], "readwrite");

  // access your pending object store
  const transactionObjectStore = transaction.objectStore("new_transaction");

  // get all records from store and set to a variable
  const getAll = transactionObjectStore.getAll();

  getAll.onsuccess = function () {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          const transaction = db.transaction(["new_transaction", "readwrite"]);
          const transactionObjectStore =
            transaction.objectStore("new_transaction");
          //clear items in store
          transactionObjectStore.clear();

          alert("All saved transaction have been submitted!");
        })
        .catch((err) => console.log(err));
    }
  };
}

// listen for app coming back online
window.addEventListener("online", uploadtransaction);
