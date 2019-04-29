// ==== <Literals>
let attributes = [
  ['vhigh', 'high', 'med', 'low'],
  ['vhigh', 'high', 'med', 'low'],
  ['2', '3', '4', '5more'],
  ['2', '4', 'more'],
  ['small', 'med', 'big'],
  ['low', 'med', 'high'],
];
let features = ['buying', 'maint', 'doors', 'persons', 'lug_boot', 'safety'];
let classes = ['unacc', 'acc', 'good', 'vgood'];
let maxTreeDepth = 16;
let prettyPrint = true;

// ==== <Statistics Functions>
function entropy(set) {
  if (set.length === 0)
    return 0;
  
  let breakdown = classes.map(clazz => set.filter(item => item[0] === clazz).length / set.length);
  
  if (breakdown.indexOf(0) !== -1)
    return 0;
  
  return breakdown.map(v => -v * Math.log2(v)).reduce((total, current) => total + current);
}

function gain(set, feature, values) {
  let ent = entropy(set);
  
  let sum = 0;
  for (let v of values) {
    let filtered = set.filter(item => item[1][feature] === v);
    sum += (filtered.length / set.length) * entropy(filtered);
  }
  
  return ent - sum;
}

function generateTree(items, maxDepth) {
  if (maxDepth === 0)
    throw 'Max depth must be at least 1';
  
  return splitNode(items, maxDepth, {depth: 1})
}

function splitNode(items, maxDepth, node) {
  // Leaf node if: max depth, same labels (entropy = 0), or same features for all items
  if (node.depth === maxDepth || entropy(items) === 0 || items.every(item => item[1].join() === items[0][1].join())) {
    let counts = classes.map(clazz => items.filter(item => item[0] === clazz).length);
    return classes[counts.indexOf(Math.max(...counts))];
  }
  
  // Find attribute to split upon
  let gains = range(attributes.length).map(feature => gain(items, feature, attributes[feature]));
  let max = gains.reduce((best, current) => best > current ? best : current);
  let feature = gains.indexOf(max);
  
  node.feature = feature;
  attributes[feature].map(value => {
    node[value] = splitNode(items.filter(item => item[1][feature] === value), maxDepth, {depth: node.depth + 1})
  });
  
  return node;
}

function predict(root, item) {
  let node = root;
  
  while (typeof node != 'string')
    node = node[item[1][node.feature]]
  
  return node;
}

// ==== <Utility functions & data>
let el;
let output = { clear: () => el.textContent = '', log: str => el.textContent += str + '\n' };
// let output = { clear: console.clear, log: console.log };

function range(count) {
  return [...Array(count).keys()];
}

function shuffle(a) {
    a = [...a]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function deepEqual(obj1, obj2) {
    if(obj1 === obj2)
        return true;

    if(isPrimitive(obj1) && isPrimitive(obj2))
        return obj1 === obj2;

    if(Object.keys(obj1).length !== Object.keys(obj2).length)
        return false;

    for(let key in obj1) {
        if(!(key in obj2)) return false;
        if(!deepEqual(obj1[key], obj2[key])) return false;
    }

    return true;
}

function isPrimitive(obj) {
    return (obj !== Object(obj));
}

// ==== <Main>
el = document.querySelector('pre');

if (prettyPrint)
  output.log('Refresh to reshuffle data\n');
else
  output.log('Depth,Training Accuracy,Testing Accuracy');

// ==== <Prep the data>
// lines = [[features ..., label], ...]
let lines = data.split('\n').map(item => item.split(','));

// columnCounts = [{featureValue: count, ...}, ...]
let columnCounts = range(attributes.length + 1).map(() => ({}));
lines.forEach(line => line.forEach((item, i) => columnCounts[i][item] = columnCounts[i][item] + 1 || 0));

// dominant = [majority value, ...]
let dominant = range(attributes.length + 1)
  .map(i => 
       Object.entries(columnCounts[i])
       .reduce((max, item) => max[1] > item[1] ? max : item))
  .map(pair => pair[0])
  .slice(1);

// filtered = [[label, [features, ...]], ...]
let filtered = lines.map(line => [line[attributes.length], line.slice(0, attributes.length).map((item, i) => item === '?' ? dominant[i] : item)]);

// ==== <Run the tests>
// Shuffle and split: training 80%, testing 20%
let training = shuffle(filtered);
let testing = training.splice(435 * 0.8);

let lastTree = null;
for (let depth = 1; depth < maxTreeDepth; depth++) {
  let tree = generateTree(training, depth);
  
  if (lastTree && deepEqual(lastTree, tree))
    break;

  let testFunc = (correct, item) => correct + (predict(tree, item) === item[0]);
  
  let trainAcc = training.reduce(testFunc, 0) / training.length;
  let testAcc = testing.reduce(testFunc, 0) / testing.length;
  

  if (prettyPrint) {
    let pretty = num => Math.round(num * 1000) / 1000;
    output.log(`Max Depth ${depth}`);
    output.log(`\t training acc: ${pretty(trainAcc)}`);
    output.log(`\t testing acc: ${pretty(testAcc)}`);
  } else {
    // output.log(`${depth},${trainAcc},${testAcc}`);
    output.log(`${testAcc}`);
  }
  
  lastTree = tree;
}

clean = tree => { Object.keys(tree).forEach(key => typeof tree[key] === 'object' && clean(tree[key])); delete tree.depth; tree.feature = features[tree.feature]; return tree; };

output.log('\nFinal tree\n');
output.log(treeify.asTree(clean(lastTree), true));