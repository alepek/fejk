# Smock

smock is a simple stateless HTTP mocking service with a faux-stateful mocking mechanism based on cookies.

Smock is intended to be consumed by a browser-like client, but should work fine for any HTTP client. Cookie capabilities are a prerequisite for faux statefulness.

## Terminology

* `smock` - a running instance of `smock`
* `scenario` - a collection of `endpoints`, stored in a `.js` file
* `endpoints` - an array of `endpoint` objects
* `endpoint` - an object containing a `request` and `response`
* `request` - a subset of an Express.js request object
* `response` - `status`, `data`, and `cookies` with which to respond to a `request`

## Getting started

Prerequisites: Node.js `^6.9.0`, Express.js.

```
const express = require('express');
const smock = require('smock');

const port = process.env.PORT || 9090;
const app = express();

// Feel free to mount the smock express app under any route
app.use('/smock', smock);

// Instructs smock where to look for scenario files
process.env.SMOCK_PATH = path.join(__dirname, 'scenarios');
app.listen(port);
```

The `SMOCK_PATH` env variable tells smock where to look for `scenario` files.

### Scenario files

A scenario file is a `.js` file that should contain an object with an `endpoints` array. The file contents may be generated in any manner you wish, but be aware that it is included by `require` during execution.

Each `endpoint` must contain a `request` and `response` object. The `request` object is used to match against incoming requests to determine whether to use the `response` object as a response or not. If there are several matches the first match in the array of `endpoints` will be used.

#### `request`

The `request` object needs to contain at least one key, but can contain any key that is present in an Express request.

Any key present in the `request` object must be present in the incoming Express request object and match exactly, with two exceptions:
 * `path` - The path in the `request` object only needs to be a **subset** of the path in the incoming request.
 * `cookies` - The cookies in the `request` object only needs to be a **subset** of the cookies in the incoming request.

#### `response`

The response object can contain the following properties:
* `status` - optional, defaults to `200`
* `data` - optional, defaults to `OK`
* `cookies` - optional, if omitted no cookies will be set.

### Sending requests

Smock has one required query string parameter - `scenario`. This parameter specifies which scenario file to load. E.g. if you want to use the scenario from the file `/scenarios/entries.js` and you've specified the `SMOCK_PATH` as `/scenarios`, the `scenario` parameter should be `entries`.

Example request:
```
http://localhost:9090/smock/items?scenario=items
```
In this request, the `scenario` parameter will determine which file to load, and the path (and potentially cookies) will determine which `endpoint` to load in that file.

## Example

Let's take a look at this example `scenario`.

```JavaScript
module.exports = {
  endpoints: [
    {
      request: {
        method: 'GET',
        path: '/items',
        cookies: {
          itemsposted: '1',
        },
      },
      response: {
        data: [
          {
            name: 'item one',
            id: '1',
          },
          {
            name: 'item two',
            id: '2',
          },
          {
            name: 'item three',
            id: '3',
          },
        ],
        cookies: {
          itemsposted: '',
        },
      },
    },
    {
      request: {
        method: 'GET',
        path: '/items',
      },
      response: {
        data: [
          {
            name: 'item one',
            id: '1',
          },
          {
            name: 'item two',
            id: '2',
          },
        ],
      },
    },
    {
      request: {
        method: 'POST',
        path: '/items',
        body: {
          name: 'item three',
        },
      },
      response: {
        status: '201',
        cookies: {
          itemsposted: '1',
        },
      },
    },
  ],
};
```

In the provided example an `/items` endpoint is provided. When performing a `GET` request to it the response will contain two items, since there should not be any cookie named `itemsposted` yet, and the first endpoint in the list will therefore not match.

After performing a `POST` request with the body `{"name": "item three"}` the `itemsposted` cookie will be set to `'1'`.

On the next `GET` request the first `GET` endpoint in the list will match since the incoming request now contains that cookie. From the browsers perspective the same endpoint is being queried, but the stored item is now present. On this `GET` request the cookie will also be set to an empty string as a means of cleanup.

Using the `cookies`, it is possible to create a service that appears to be stateful, but in fact it is not.

### Running the example

Clone the repository, `npm install`, `npm run example` and start sending requests to the smock!

Here's some JS to paste into your console, check out the network tab while running these in the order `GET` `POST` `GET`.

**Initial GET**
```JavaScript
(function() {
var xhr = new XMLHttpRequest();
xhr.open("GET", "http://localhost:9090/smock/items?scenario=items");

xhr.send();})();
```

**POST**
```JavaScript
(function() {
var data = JSON.stringify({
  "name": "item three"
});

var xhr = new XMLHttpRequest();
xhr.open("POST", "http://localhost:9090/smock/items?scenario=items");
xhr.setRequestHeader("content-type", "application/json");

xhr.send(data);})();
```
