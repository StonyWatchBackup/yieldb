
var mquery = require('mquery');
var assert = require('assert');
var m = require('../');

// patch mocha to accept generators
require('co-mocha');

// default test database
var uri = process.env.YIELDB_TEST_URI;
if (!('string' == typeof uri && uri.length)) {
  throw new Error('Missing YIELDB_TEST_URI environment variable');
}

describe('yieldb', function() {
  describe('exposes', function() {
    it('Db', function(done) {
      assert.equal('function', typeof m.Db);
      done();
    });

    it('Collection', function(done) {
      assert.equal('function', typeof m.Collection);
      done();
    });

    it('mongodb', function(done) {
      assert(m.mongodb);
      done();
    });
  });

  describe('connect()', function() {
    it('is a GeneratorFunction', function(done) {
      assert.equal('GeneratorFunction', m.connect.constructor.name);
      done();
    });

    it('connects to mongodb when yielded', function*() {
      var db = yield m.connect(uri);
      assert(db);
    });
  });

  describe('Db', function() {
    describe('close()', function() {
      it('returns a thunk', function*() {
        var db = yield m.connect(uri);
        assert('function', typeof db.close());
      });
    });

    describe('col()', function() {
      it('returns a Collection', function*() {
        var db = yield m.connect(uri);
        var name = 'users';
        var User = db.col(name);
        assert(User instanceof m.Collection);
        assert.equal(name, User.name);
      });
    });

    describe('drop', function() {
      it('returns a thunk', function*() {
        var db = yield m.connect(uri);
        assert('function', typeof db.drop());
      });

      it('deletes all database contents', function*() {
        var db = yield m.connect(uri);

        var X = db.col('x');
        var Y = db.col('y');

        yield [ X.insert({ pebble: true }), Y.insert({ pebble: true }) ];
        yield db.drop();

        var count = yield [ X.count(), Y.count() ];
        assert.strictEqual(0, count[0] + count[1]);
      });

    });
  });

  describe('Collection', function() {
    var db;
    var User;
    var name = 'users';
    var lastOfUs;
    var zelda;

    before(function*() {
      db = yield m.connect(uri);
      User = db.col(name);

      // use underlying driver for creation

      lastOfUs = (yield function(cb) {
        User.col.insert({ name: 'Last Of Us' }, cb);
      })[0];

      zelda = (yield function(cb) {
        User.col.insert({ name: 'Zelda' }, cb);
      })[0];
    });

    after(function*() {
      yield function(cb) {
        User.col.drop(cb);
      }
    });

    it('has a name', function(done) {
      assert.equal(name, User.name);
      done();
    });

    describe('#find()', function() {

      it('returns an mquery', function(done) {
        var query = User.find();
        assert(query instanceof mquery);
        done();
      });

      it('responds with an array', function*() {
        var arr = yield User.find();
        assert(Array.isArray(arr));
        assert.equal(2, arr.length);
      });

      it('does not throw an error when no doc is found', function*() {
        var arr = yield User.find({ asdf: 'asdf098' });
        assert(Array.isArray(arr));
        assert.equal(0, arr.length);
      });

      it('accepts a selector', function*() {
        var res = yield {
          zero: User.find({x:1})
        , one: User.find({ name: 'Last Of Us' })
        }

        assert.equal(0, res.zero.length);
        assert.equal(1, res.one.length);
      });

      it('accepts options', function*() {
        var arr = yield User.find({}, { select: { _id: 0 }});
        assert.equal(2, arr.length);
        arr.forEach(function(doc) {
          assert(doc.name);
          assert(!doc.isNew);
          assert(!doc._id);
        })
      });

      describe('casts', function() {
        it('hexstring args to { _id: ObjectId(hexstring) }', function*() {
          var arr = yield User.find(String(lastOfUs._id));
          assert.equal(1, arr.length);
          assert.equal('Last Of Us', arr[0].name);
        });

        it('hexstring _id to ObjectId(hexstring)', function*() {
          var arr = yield User.find({ _id: String(lastOfUs._id) });
          assert.equal(1, arr.length);
          assert.equal('Last Of Us', arr[0].name);
        });
      });

      describe('.stream()', function() {
        it('returns a stream', function(done) {
          var err = null;
          var docs = [];

          var stream = User.find().stream();

          stream.on('data', function(doc) {
            docs.push(doc);
          })

          stream.on('error', function(error) {
            err = error;
          });

          stream.on('close', function() {
            if (err) return done(err);
            assert.equal(2, docs.length);
            done();
          })
        });
      });
    });

    describe('#findOne()', function() {
      it('returns an mquery', function(done) {
        var query = User.findOne();
        assert(query instanceof mquery);
        done();
      });

      it('responds with a single doc', function*() {
        var doc = yield User.findOne();
        assert(doc);
        assert(!Array.isArray(doc));
        assert(Object.keys(doc).length);
        assert(doc._id);
      });

      it('does not throw an error when no doc is found', function*() {
        var doc = yield User.findOne({ asdf: 'asdf098' });
        assert.equal(undefined, doc);
      });

      it('accepts a selector', function*() {
        var res = yield {
          zero: User.find({x:1})
        , one: User.find({ name: 'Last Of Us' })
        }

        assert.equal(0, res.zero.length);
        assert.equal(1, res.one.length);
      });

      it('accepts options', function*() {
        var arr = yield User.find({}, { select: '-_id' });
        assert.equal(2, arr.length);
        arr.forEach(function(doc) {
          assert(doc.name);
          assert(!doc.isNew);
          assert(!doc._id);
        })
      });

      describe('casts', function() {
        it('hexstring args to { _id: ObjectId(hexstring) }', function*() {
          var arr = yield User.find(String(lastOfUs._id));
          assert.equal(1, arr.length);
          assert.equal('Last Of Us', arr[0].name);
        });

        it('hexstring _id to ObjectId(hexstring)', function*() {
          var arr = yield User.find({ _id: String(lastOfUs._id) });
          assert.equal(1, arr.length);
          assert.equal('Last Of Us', arr[0].name);
        });
      });
    });

    describe('#insert()', function() {
      it('returns a thunk', function(done) {
        var fn = User.insert({});
        assert.equal('function', typeof fn);
        done();
      });

      describe('arguments', function() {
        describe('throws', function() {
          it('when nothing is passed', function*() {
            assert.throws(function(){
              User.insert();
            })
          });
          it('when undefined is passed', function*() {
            assert.throws(function(){
              User.insert(undefined);
            })
          });
          it('when null is passed', function*() {
            assert.throws(function(){
              User.insert(null);
            })
          });
          it('when function is passed', function*() {
            assert.throws(function(){
              User.insert(function(){});
            })
          });
          it('when array containing non-objects is passed', function*() {
            assert.throws(function(){
              User.insert([null]);
            });
          });
        });
      });

      describe('with single docs', function() {
        var name = 'supports single docs';
        var original = { name: name };
        var res;
        var doc;

        before(function*() {
          res = yield User.insert(original);
          doc = yield User.findOne(original);
        });

        it('works', function*() {
          assert.equal(doc.name, name);
        });

        it('returns the result doc', function*() {
          assert(res);
          assert.equal(1, res.ok);
        });

        describe('if missing _id', function() {
          it('receives an _id set to an ObjectId', function*() {
            assert(original._id);
            var found = yield User.findOne(original._id);
            assert.equal(name, found.name);
          });
        });

        it('accepts options', function*() {
          var res = yield User.insert(
            { acceptsOptions: true }
          , { fullResult: false }
          );

          assert(res);
          assert(1, res.length);
        });
      });

      describe('with multiple docs', function() {
        var res;
        var docs;
        var originals;
        var count = 2;

        before(function*() {
          originals = [];

          for (var i = 0; i < count; ++i) {
            var name = 'supports multi docs: ' + i;
            originals.push({ name: name });
          }

          res = yield User.insert(originals);
          docs = yield User.find({ $or: originals });
        });

        it('works', function*() {
          assert.equal(2, docs.length);
        });

        it('returns the result of the operation', function*() {
          assert(res);
          assert.equal(1, res.ok);
        });

        it('accepts options', function*() {
          var res = yield User.insert(
            [{ acceptsOptions: true }, { acceptsOptions: true }]
          , { fullResult: false }
          );

          assert(Array.isArray(res));
          assert.equal(2, res.length);
        });

        describe('if missing _id', function() {
          it('receive an _id set to an ObjectId', function*() {
            originals.forEach(function(doc) {
              assert(doc._id);
            });
          });
        });
      });
    });

    describe('#update()', function() {
      it('returns an mquery', function(done) {
        var query = User.update({}, {});
        assert(query instanceof mquery);
        done();
      });

      describe('arguments', function() {
        describe('selector', function() {
          it('is required', function*() {
            assert.throws(function() {
              User.update(null, {});
            }, /missing selector/);
          });
        });
        describe('update', function() {
          it('is required', function*() {
            assert.throws(function() {
              User.update({});
            }, /missing update/);
          });
        });
      });

      describe('options', function() {
        describe('multi', function() {
          var docs = [];
          var count = 3;

          before(function*() {
            for (var i = 0; i < count; ++i) {
              docs.push({ updateMulti: true, _id: i });
            }

            yield User.insert(docs);
          });

          it('defaults to true', function*() {
            yield User.update({ updateMulti: true }, { $addToSet: { x: ':)' }});

            var found = yield User.find({ updateMulti: true });

            assert.equal(count, found.length);

            found.forEach(function(doc) {
              assert.equal(':)', doc.x);
            });
          });

          it('can be overridden', function*() {
            yield User.update({ updateMulti: true }, { $set: { i: 'changed' }}, { multi: false });

            var found = yield User.find({ updateMulti: true });
            var updated = 0;

            found.forEach(function(doc) {
              if ('changed' == doc.i) updated++;
            });

            assert.equal(1, updated);
          });
        });
      });

      describe('casts', function() {
        it('hexstring args to { _id: ObjectId(hexstring) }', function*() {
          var res = yield User.update(String(lastOfUs._id), { $set: { rating: 5 }});
          assert.equal(1, res.n);

          var doc = yield User.findOne(lastOfUs._id);
          assert.equal(5, doc.rating);
        });

        it('hexstring _id to ObjectId(hexstring)', function*() {
          var numUpdated = yield User.update({ _id: String(lastOfUs._id) }, { $set: { rating: 4 }});
          var doc = yield User.findOne(lastOfUs._id);
          assert.equal(4, doc.rating);
        });
      });

      it('returns the result of the operation', function*() {
        var selector = { _id: 'update returns the result of the op' };
        var res = yield User.update(selector, { $set: { x: 1 }});
        assert(res);
        assert.equal(0, res.n);
        assert.equal(true, res.ok);
      });
    });

    describe('#remove()', function() {
      it('returns an mquery', function(done) {
        var query = User.remove({_id: '#remove' });
        assert(query instanceof mquery);
        done();
      });

      describe('arguments', function() {
        describe('selector', function() {
          it('is required', function*() {
            assert.throws(function() {
              User.remove();
            }, /missing selector/);
          });
        });
      });

      describe('option', function() {
        describe('of multi', function() {
          it('defaults to true', function*() {
            var name = '#remove defaults true';
            var docs = [{ n: name }, { n: name }];
            yield User.insert(docs);
            yield User.remove({ n: name });
            assert.equal(0, (yield User.find({ n: name })).length);
          });

          it('can be overridden', function*() {
            var name = '#remove defaults overridden';
            var docs = [{ n: name }, { n: name }];
            yield User.insert(docs);
            yield User.remove({ n: name }, { multi: false });
            assert.equal(1, (yield User.find({ n: name })).length);
          });
        });

        describe('of fullResult', function() {
          it('defaults to true', function*() {
            var name = '#remove fullResult true';
            var docs = [{ n: name }, { n: name }];
            yield User.insert(docs);
            var res = yield User.remove({ n: name });
            assert(res);
            assert.equal(true, res.ok);
            assert.equal(2, res.n);
          });

          it('can be overridden', function*() {
            var name = '#remove fullResult override';
            var docs = [{ n: name }, { n: name }];
            yield User.insert(docs);
            var res = yield User.remove({ n: name }, { fullResult: false });
            assert.equal(2, res);
          });
        });
      });

      describe('casts', function() {
        var doc1 = { name: '#remove 1' };
        var doc2 = { name: '#remove 2' };

        before(function*() {
          yield User.insert(doc1);
          yield User.insert(doc2);
        });

        it('hexstring args to { _id: ObjectId(hexstring) }', function*() {
          var id = String(doc1._id);
          var res = yield User.remove(id);
          assert.equal(1, res.n);

          var doc = yield User.findOne(id);
          assert.equal(null, doc);
        });

        it('hexstring _id to ObjectId(hexstring)', function*() {
          var id = String(doc2._id);
          var res = yield User.remove({ _id: id });
          assert.equal(1, res.n);

          var doc = yield User.findOne(id);
          assert.equal(null, doc);
        });
      });
    });

    describe('#aggregate()', function() {

      var inserted = [
        { aggregate: true, x: 0 }
      , { aggregate: true, x: 1 }
      , { aggregate: true, x: 2 }
      ];

      before(function*() {
        yield User.insert(inserted);
      });

      it('returns a thunk', function(done) {
        var fn = User.aggregate([]);
        assert.equal('function', typeof fn);
        done();
      });

      it('responds with an array', function*() {
        var arr = yield User.aggregate([{ $match: { aggregate: true }}]);
        assert(Array.isArray(arr));
        assert.equal(inserted.length, arr.length);
      });

      it('does not throw an error when no docs are found', function*() {
        var arr = yield User.aggregate([{ $match: { asdf: 'asdf098' } }]);
        assert(Array.isArray(arr));
        assert.equal(0, arr.length);
      });

      it('accepts a pipeline array', function*() {
        var res = yield {
          zero: User.aggregate([{ $match: { aggregate: true }}, { $match: {x: {$lt: 0}}} ])
        , one: User.aggregate([{ $match: { aggregate: true }}, { $limit: 1 }])
        }

        assert.equal(0, res.zero.length);
        assert.equal(1, res.one.length);
      });

      describe('casts', function() {
        it('hexstring args to { _id: ObjectId(hexstring) }', function*() {
          var id = String(lastOfUs._id);
          var arr = yield User.aggregate([{ $match: id }]);
          assert.equal(1, arr.length);
          assert.equal('Last Of Us', arr[0].name);
        });

        it('hexstring _id to ObjectId(hexstring)', function*() {
          var id = String(lastOfUs._id);
          var arr = yield User.aggregate([{ $match: { _id: id } }]);
          assert.equal(1, arr.length);
          assert.equal('Last Of Us', arr[0].name);
        });
      });

      describe('.stream()', function() {
        it('returns a stream', function(done) {
          var err = null;
          var docs = [];

          var stream = User.aggregate([{ $match: { aggregate: true } }]).stream();
          stream.on('readable', function() {
            var doc;
            while (null !== (doc = stream.read())) {
              docs.push(doc);
            }
          });

          stream.on('error', function(error) {
            err = error;
          });

          stream.on('end', function() {
            if (err) return done(err);
            assert.equal(3, docs.length);
            done();
          })
        });
      });

      describe('arguments', function() {
        describe('pipeline', function() {
          it('is required', function*() {
            assert.throws(function() {
              User.aggregate();
            }, /pipeline must be an array/);
          });
        });
      });
    });

    describe('#findOneAndUpdate()', function() {
      var inserted = [
        { findOneAndUpdate: true }
      , { findOneAndUpdate: true }
      ];

      before(function*() {
        yield User.insert(inserted);
      });

      it('returns an mquery', function(done) {
        var query = User.findOneAndUpdate({}, {});
        assert(query instanceof mquery);
        done();
      });

      it('responds with a single doc', function*() {
        var doc = yield User.findOneAndUpdate({ findOneAndUpdate: true }, { $set: { color: 'green' }});
        assert(doc);
        assert.equal('green', doc.color);
      });

      it('does not throw an error when no doc is found', function*() {
        var doc = yield User.findOneAndUpdate({ findOneAndUpdate: true, asdf: '3hfa' }, { $set: { color: 'green' }});
        assert.equal(null, doc);
      });

      describe('casts', function() {
        it('hexstring args to { _id: ObjectId(hexstring) }', function*() {
          var id = String(lastOfUs._id);
          var doc= yield User.findOneAndUpdate(id, { $set: { findAndModified: 5 }});
          assert(doc);
          assert.equal('Last Of Us', doc.name);
        });

        it('hexstring _id to ObjectId(hexstring)', function*() {
          var id = String(lastOfUs._id);
          var doc= yield User.findOneAndUpdate({ _id: id }, { $unset: { findAndModified: true }});
          assert(doc);
          assert.equal('Last Of Us', doc.name);
        });
      });

      describe('arguments', function() {
        describe('options', function() {
          describe('new', function() {
            it('defaults to true', function*() {
              var doc = yield User.findOneAndUpdate({ findOneAndUpdate: true }, { $set: { color: 'blue' }});
              assert(doc);
              assert.equal('blue', doc.color);
            });
            it('can be overridden', function*() {
              var doc = yield User.findOneAndUpdate({ findOneAndUpdate: true }, { $set: { color: 'red' }}, { new: false });
              assert(doc);
              assert('red' !== doc.color);
            });
          });
        });
      });
    });

    describe('#findOneAndRemove()', function() {
      var inserted = [
        { findOneAndRemove: true }
      , { findOneAndRemove: true }
      ];

      before(function*() {
        yield User.insert(inserted);
      });

      it('returns an mquery', function(done) {
        var query = User.findOneAndRemove({}, {});
        assert(query instanceof mquery);
        done();
      });

      it('responds with a single doc', function*() {
        var doc = yield User.findOneAndRemove({ findOneAndRemove: true });
        assert(doc);
        var remaining = yield User.count({ findOneAndRemove: true });
        assert.equal(1, remaining);
      });

      it('does not throw an error when no doc is found', function*() {
        var doc = yield User.findOneAndRemove({ findOneAndRemove: true, asdf: '3hfa' });
        assert.equal(null, doc);
      });

      describe('casts', function() {
        it('hexstring args to { _id: ObjectId(hexstring) }', function*() {
          var id = String(lastOfUs._id);
          var doc= yield User.findOneAndRemove(id);
          assert(doc);
          assert.equal('Last Of Us', doc.name);
          yield User.insert(doc);
        });

        it('hexstring _id to ObjectId(hexstring)', function*() {
          var id = String(lastOfUs._id);
          var doc= yield User.findOneAndRemove({ _id: id });
          assert(doc);
          assert.equal('Last Of Us', doc.name);
          yield User.insert(doc);
        });
      });
    });

    describe('#count', function() {
      it('returns an mquery', function(done) {
        var query = User.count();
        assert(query instanceof mquery);
        done();
      });

      it('responds with a number', function*() {
        yield User.insert([{ counter: 'fun' }, { counter: 'stuff' }]);
        var count = yield User.count({ counter: { $exists: true }});
        assert.equal(2, count);
      });

      it('accepts a selector', function*() {
        var count = yield User.count({ counter: 'stuff' });
        assert.strictEqual(1, count);
      });

      it('accepts options', function*() {
        var count = yield User.count({}, { skip: 100 });
        assert.strictEqual(0, count);
      });

      describe('casts', function() {
        it('hexstring args to { _id: ObjectId(hexstring) }', function*() {
          var count = yield User.count(String(lastOfUs._id));
          assert.strictEqual(1, count);
        });

        it('hexstring _id to ObjectId(hexstring)', function*() {
          var count = yield User.count({ _id: String(lastOfUs._id) });
          assert.strictEqual(1, count);
        });
      });
    });

    /*
    describe('#distinct', function() {
      // casting

    });
    describe('#mapReduce', function() {
      // casting

    });
    describe('#geoNear', function() {
      // casting

    });
    describe('#geoSearch', function() {
      // casting

    });
    */
  });
});
