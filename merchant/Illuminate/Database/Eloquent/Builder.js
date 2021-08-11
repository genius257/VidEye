import { is_null, isset } from "locutus/php/var";
import { count, array_map } from "locutus/php/array";
import { strpos } from "locutus/php/strings";

/* eslint-disable no-loop-func */

export default class Builder {
  query = null;
  model = null;
  eagerLoad = [];
  macros = [];
  localMacros = [];
  onDelete = null;
  passthru = [
    "insert",
    "insertOrIgnore",
    "insertGetId",
    "insertUsing",
    "getBindings",
    "toSql",
    "dump",
    "dd",
    "exists",
    "doesntExist",
    "count",
    "min",
    "max",
    "avg",
    "average",
    "sum",
    "getConnection",
    "raw",
    "getGrammar"
  ];
  scopes = [];
  removedScopes = [];

  /**
   * Create a new Eloquent query builder instance.
   * @param {\Illuminate\Database\Query\Builder} query
   */
  constructor(query) {
    this.query = query;
  }

  /**
   * Set a model instance for the model being queried.
   * @param {\Illuminate\Database\Eloquent\Model} model
   * @returns {this}
   */
  setModel(model) {
    this.model = model;

    this.query.from(model.getTable());

    return this;
  }

  where(column, operator = null, value = null, boolean = "and") {
    if (typeof column === "function" && is_null(operator)) {
      let query = this.model.newQueryWithoutRelationships();
      column(query);

      this.query.addNestedWhereQuery(query.getQuery(), boolean);
    } else {
      this.query.where(...arguments);
    }

    return this;
  }

  get(columns = ["*"]) {
    let builder = this.applyScopes();

    // If we actually found models we will also eager load any relationships that
    // have been specified as needing to be eager loaded, which will solve the
    // n+1 query issue for the developers to avoid running a lot of queries.
    let models = builder.getModels(columns);
    if (count(models) > 0) {
      models = builder.eagerLoadRelations(models);
    }

    return builder.getModel().newCollection(models);
  }

  /**
   * @returns {Builder}
   */
  applyScopes() {
    if (!this.scopes) {
      return this;
    }

    // js equivalent of: $builder = clone this;
    let builder = Object.assign(
      Object.create(Object.getPrototypeOf(this)),
      this
    );

    for (const [identifier, scope] of Object.entries(this.scopes)) {
      if (!isset(builder.scopes[identifier])) {
        continue;
      }

      builder.callScope(function(builder) {
        // If the scope is a Closure we will just go ahead and call the scope with the
        // builder instance. The "callScope" method will properly group the clauses
        // that are added to this query so "where" clauses maintain proper logic.
        if (typeof scope === "function") {
          scope(builder);
        }

        // If the scope is a scope object, we will call the apply method on this scope
        // passing in the builder and the model instance. After we run all of these
        // scopes we will return back the builder instance to the outside caller.
        if (scope instanceof Scope) {
          scope.apply(builder, this.getModel());
        }
      });
    }

    return builder;
  }

  getModels(columns = ["*"]) {
    return this.model.hydrate(this.query.get(columns).all()).all();
  }

  hydrate(items) {
    let instance = this.newModelInstance();

    return instance.newCollection(
      array_map(function(item) {
        return instance.newFromBuilder(item);
      }, items)
    );
  }

  newModelInstance(attributes = []) {
    return this.model
      .newInstance(attributes)
      .setConnection(this.query.getConnection().getName());
  }

  getModel() {
    return this.model;
  }

  eagerLoadRelations(models) {
    for (const [name, constraints] of Object.entries(this.eagerLoad)) {
      // For nested eager loads we'll skip loading them here and they will be set as an
      // eager load on the query to retrieve the relation so that they will be eager
      // loaded on that query, because that is where they get hydrated as models.
      if (strpos(name, ".") === false) {
        models = this.eagerLoadRelation(models, name, constraints);
      }
    }

    return models;
  }

  eagerLoadRelation(models, name, constraints) {
    // First we will "back up" the existing where conditions on the query so we can
    // add our eager constraints. Then we will merge the wheres that were on the
    // query back to it in order that any where conditions might be specified.
    let relation = this.getRelation(name);

    relation.addEagerConstraints(models);

    constraints(relation);

    // Once we have the results, we just match those back up to their parent models
    // using the relationship instance. Then we just return the finished arrays
    // of models which have been eagerly hydrated and are readied for return.
    return relation.match(
      relation.initRelation(models, name),
      relation.getEager(),
      name
    );
  }

  getRelation(name) {
    // We want to run a relationship query without any constrains so that we will
    // not have to remove these where clauses manually which gets really hacky
    // and error prone. We don't want constraints because we add eager ones.
    let relation = Relation.noConstraints(function() {
      try {
        return this.getModel()
          .newInstance()
          .$name();
      } catch (/* BadMethodCallException */ e) {
        throw RelationNotFoundException.make(this.getModel(), name);
      }
    });

    let nested = this.relationsNestedUnder(name);

    // If there are nested relationships set on the query, we will put those onto
    // the query instances so that they can be handled after this relationship
    // is loaded. In this way they will all trickle down as they are loaded.
    if (count(nested) > 0) {
      relation.getQuery().with(nested);
    }

    return relation;
  }

  make(attributes = {}) {
    return this.newModelInstance(attributes);
  }
}
