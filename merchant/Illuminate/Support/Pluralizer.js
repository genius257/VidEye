import { abs } from "locutus/php/math";
import { in_array } from "locutus/php/array";
import { strtolower, strtoupper, ucfirst, ucwords } from "locutus/php/strings";
import pluralize from "pluralize";

export default class Pluralizer {
  static $uncountable = [
    "audio",
    "bison",
    "cattle",
    "chassis",
    "compensation",
    "coreopsis",
    "data",
    "deer",
    "education",
    "emoji",
    "equipment",
    "evidence",
    "feedback",
    "firmware",
    "fish",
    "furniture",
    "gold",
    "hardware",
    "information",
    "jedi",
    "kin",
    "knowledge",
    "love",
    "metadata",
    "money",
    "moose",
    "news",
    "nutrition",
    "offspring",
    "plankton",
    "pokemon",
    "police",
    "rain",
    "recommended",
    "related",
    "rice",
    "series",
    "sheep",
    "software",
    "species",
    "swine",
    "traffic",
    "wheat"
  ];

  static plural(value, count = 2) {
    if (abs(count) === 1 || this.uncountable(value)) {
      return value;
    }

    //let plural = this.inflector().pluralize(value);
    let plural = pluralize(value);

    return this.matchCase(plural, value);
  }

  static inflector() {
    console.error("[Pluralizer::inflector]: not yet implemented");
    /*
    static $inflector;

    if (is_null($inflector)) {
        $inflector = new Inflector(
            new CachedWordInflector(new RulesetInflector(
                English\Rules::getSingularRuleset()
            )),
            new CachedWordInflector(new RulesetInflector(
                English\Rules::getPluralRuleset()
            ))
        );
    }

    return $inflector;
    */
  }

  static uncountable(value) {
    return in_array(strtolower(value), this.$uncountable);
  }

  static matchCase(value, comparison) {
    let functions = [strtolower, strtoupper, ucfirst, ucwords];

    for (const $function of functions) {
      if ($function(comparison) === comparison) {
        return $function(value);
      }
    }

    return value;
  }
}
