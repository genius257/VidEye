import { json_decode, json_encode } from "locutus/php/json";
import { sha1 } from "locutus/php/strings";
import { isset } from "locutus/php/var";
import Builder from "./Builder";
import { Model, ProxyIt } from "./Model";

// https://github.com/laravel/framework/blob/7.x/tests/Database/DatabaseEloquentModelTest.php

class _EloquentModelStub extends Model {
    public $connection;
    public $scopesCalled = [];
    protected $table = "stub";
    protected $guarded = [];

    protected $morph_to_stub_type = EloquentModelSaveStub; // eslint-disable-line @typescript-eslint/no-use-before-define
    protected $casts = { castedFloat: "float" };

    public getListItemsAttribute($value) {
        return json_decode($value);
    }

    public setListItemsAttribute($value) {
        this.attributes["list_items"] = json_encode($value);
    }

    public getPasswordAttribute() {
        return "******";
    }

    public setPasswordAttribute($value) {
        this.attributes["password_hash"] = sha1($value);
    }

    public publicIncrement($column, $amount = 1, $extra = []) {
        return this.increment($column, $amount, $extra);
    }

    public belongsToStub() {
        return this.belongsTo(EloquentModelSaveStub); // eslint-disable-line @typescript-eslint/no-use-before-define
    }

    public morphToStub() {
        return this.morphTo();
    }

    public morphToStubWithKeys() {
        return this.morphTo(null, "type", "id");
    }

    public morphToStubWithName() {
        return this.morphTo("someName");
    }

    public morphToStubWithNameAndKeys() {
        return this.morphTo("someName", "type", "id");
    }

    public belongsToExplicitKeyStub() {
        return this.belongsTo(EloquentModelSaveStub, "foo"); // eslint-disable-line @typescript-eslint/no-use-before-define
    }

    public incorrectRelationStub() {
        return "foo";
    }

    public getDates() {
        return [];
    }

    public getAppendableAttribute() {
        return "appended";
    }

    public scopePublished($builder: Builder) {
        this.$scopesCalled.push("published");
    }

    public scopeCategory($builder: Builder, $category) {
        this.$scopesCalled["category"] = $category;
    }

    public scopeFramework($builder: Builder, $framework, $version) {
        this.$scopesCalled["framework"] = [$framework, $version];
    }
}

const EloquentModelStub = ProxyIt(_EloquentModelStub);

class _EloquentModelSaveStub extends Model {
    protected $table = "save_stub";
    protected $guarded = [];

    public save($options = []) {
        if (this.fireModelEvent("saving") === false) {
            return false;
        }

        $_SERVER["__eloquent.saved"] = true;

        this.fireModelEvent("saved", false);
    }

    public setIncrementing($value: boolean): this {
        this.incrementing = $value;

        return this;
    }

    public getConnection() {
        const $mock = m.mock(Connection);
        $mock
            .shouldReceive("getQueryGrammar")
            .andReturn(($grammar = m.mock(Grammar)));
        $mock
            .shouldReceive("getPostProcessor")
            .andReturn(($processor = m.mock(Processor)));
        $mock.shouldReceive("getName").andReturn("name");
        $mock.shouldReceive("query").andReturnUsing(function () {
            return new BaseBuilder($mock, $grammar, $processor);
        });

        return $mock;
    }
}

const EloquentModelSaveStub = ProxyIt(_EloquentModelSaveStub);

test("Attribute Manipulation", () => {
    const $model = new EloquentModelStub();
    $model.setAttribute("name", "foo");
    expect($model.getAttribute("name")).toBe("foo");
    expect(isset($model.getAttribute("name"))).toBe(true);
    $model.offsetUnset("name");
    expect(isset($model.getAttribute("name"))).toBe(false);

    // test mutation
    $model.setAttribute("list_items", { name: "taylor" });
    expect($model.getAttribute("list_items")).toEqual({ name: "taylor" });
    const $attributes = $model.getAttributes();
    expect($attributes["list_items"]).toEqual(json_encode({ name: "taylor" }));
});
