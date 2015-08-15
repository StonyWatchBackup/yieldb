
2.7.1 / 2015-08-15
==================

 * fix dropIndex fn name
 * fix dropIndex debug message #17 [bitinn](https://github.com/bitinn)
 * add dropIndex validation

2.7.0 / 2015-08-14
==================

 * dropindex support [bitinn](https://github.com/bitinn)
 * upgrade mongo, mquery & istanbul dependencies

2.6.0 / 2015-06-03
==================

 * add ObjectId casting support #12 [Jtupiter](https://github.com/Jtupiter)
 * bump mquery to 1.6.0
 * fix findOne tests

2.5.0 / 2015-05-22
==================

 * add Collection.setOptions support

2.4.1 / 2015-05-18
==================

 * bump mongo driver to 1.4.38

2.4.0 / 2015-05-14
==================

 * fixed; db.close().then resolution not always firing #11
 * updated; mongo driver to 1.4.37
 * updated; docs
 * travis: support node 0.12

2.3.1 / 2015-03-31
==================

 * bump mquery to 1.5.0

2.3.0 / 2015-03-29
==================

 * Add backward compatible Promise support
 * Promisify db.close()
 * Promisify db.drop()
 * Promisify db.listCollections()
 * Promisify db.ping()
 * Promisify db.serverStatus()
 * Promisify collection.indexes()
 * Promisify collection.index()
 * Promisify collection.aggregate()
 * Promisify collection.drop()
 * Promisify collection.insert()
 * update mongodb and mquery
 * use iojs

2.2.2 / 2015-02-27
==================

 * updated; driver to 1.4.32
 * updated; mquery to 1.3.0

2.2.1 / 2015-01-06
==================

 * fix db.listCollections()

2.2.0 / 2015-01-06
==================

 * expose listCollections on native driver #5 [bitinn](https://github.com/bitinn)
 * update driver to 1.2.28 (fixes #4)

2.1.0 / 2014-12-16
==================

 * expose mquery module

2.0.1 / 2014-12-16
==================

 * add examples dir
 * bump mongodb driver to 1.4.23
 * bump devDeps
 * Update README.md

2.0.0 / 2014-10-10
==================

 * removed; db.stats()
 * removed; db.getCollections()
 * added; db.ping()
 * added; collection.index()
 * added; collection.indexes()
 * added; collection.distinct()
 * fixed; debug output
 * updated; mongo driver to 1.4.19
 * 100% test coverage
 * improved; docs

1.2.0 / 2014-10-08
==================

 * added; collection.drop()
 * added; db.drop()
 * bump driver
 * docs

1.1.0 / 2014-10-06
==================

 * expose driver
 * better debug msg

1.0.0 / 2014-09-18
==================

 * birth
