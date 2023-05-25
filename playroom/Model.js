import { Episode } from "../src/models/Episode";

const episode = new Episode();
console.log(episode);
console.log(episode.constructor.name);

console.log(episode.constructor.prototype.constructor.name);
//console.log(episode.constructor.constructor.constructor.toString());

let i = 0;
const maxDepth = 15;
let $class = Episode;
const classPrototype = Object.getPrototypeOf(class {});

do {
  console.log($class.name);
  const isTrait = $class.hasOwnProperty("__trait__");
  console.log("trait", isTrait);
  $class = Object.getPrototypeOf($class);
  //console.log($class.constructor);
  i++;
  if (i >= maxDepth) {
    break;
  }
} while ($class !== classPrototype);
