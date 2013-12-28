# noboxout-chat [![Build Status](https://secure.travis-ci.org/llafuente/noboxout-chat.png?branch=master)](http://travis-ci.org/llafuente/noboxout-chat)
==========

## Introduction
============

Chat used in Noboxout games like www.mesians.com


## Usage
============

In examples/ folder there are our base code (almost the same).

* see examples/index.html for client side integration
* see examples/server.js for server side integration (using socket.io like us) You need memcache module to run the server


The chat system is user agnostic so you need to implement some function to retrieve user information, denied access etc...
All is in examples/server.js and test/*.js (first lines) so have some examples there about how to use it.


If you need more information, please file an issue and We will extend the documentation.


## Reporting bugs.

We have two tests atm.
first, the core one that Test classes
second, the protocol one using socket.io, test the protocol and the classes...

To report a bug, write a test and upload to a gist (could be only the a function)

if not. You have to be VERY SPECIFIC!



## Install (soon in npm)
==========

With [npm](http://npmjs.org) do:

```

npm install noboxout-chat


```

## test (travis-ci ready!)
==========================

```

npm test
// or
cd /test
node test.js

```

## license
==========

MIT.


gg & hf!