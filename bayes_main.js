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
let safeLogMin = -100;

let trials = true;

// ==== <Utility functions & data>
let el;
let output = { log: str => el.textContent += str + '\n' };
// let output = { log: console.log };

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

function sum(total, item) {
  return total + item;
}

// ==== <Stats Functions>
function predict(item, cprob, pprob) {
  let prob = classes.map(clazz => item[1].map((v, i) => safeLog(cprob[v + features[i] + clazz])).reduce(sum) + safeLog(pprob[clazz]));
  return classes[prob.indexOf(Math.max(...prob))];
}

function safeLog(n) {
  return Math.max(safeLogMin, Math.log(n));
}

// ==== <Main>
el = document.querySelector('pre');

// ==== <Prep the data>
// lines = [[label, feature, ...], ...]
let lines = data.split('\n').map(item => item.split(','));

// columnCounts = [{featureValue: count, ...}, ...]
let columnCounts = range(features.length + 1).map(() => ({}));
lines.forEach(line => line.forEach((item, i) => columnCounts[i][item] = columnCounts[i][item] + 1 || 0));

// dominant = [majority value, ...]
let dominant = range(features.length + 1)
  .map(i =>
    Object.entries(columnCounts[i])
      .reduce((max, item) => max[1] > item[1] ? max : item))
  .map(pair => pair[0])
  .slice(1);

// filtered = [[label, [features, ...]], ...]
let filtered = lines.map(line => [line[attributes.length], line.slice(0, attributes.length).map((item, i) => item === '?' ? dominant[i] : item)]);

// ==== <Run the tests>
function evaluateData(print = false) {
  // Shuffle and split: training 80%, testing 20%
  let training = shuffle(filtered);
  let testing = training.splice(filtered.length * 0.8);

  // conditional probabilites
  // { attribfeatureclass, ... }
  let cprob = {};
  for (let c of classes) {
    let trainP = training.filter(item => item[0] === c);

    for (let f = 0; f < features.length; f++) {
      for (let a of attributes[f]) {
        cprob[a + features[f] + c] = trainP.filter(item => item[1][f] === a).length / trainP.length
      }
    }
  }

  // prior probrabilities
  // { class: %, ... }
  let pprob = {};
  for (let c of classes)
    pprob[c] = training.filter(item => item[0] === c).length / training.length;

  // ==== <Run Predictions>
  let correct = 0;
  for (let item of testing)
    if (item[0] === predict(item, cprob, pprob))
      correct++;

  // Output results
  if (print)
    output.log(`${correct} correct of ${testing.length} samples, accuracy = ${(correct / testing.length).toFixed(3)}\n\n\n`);

  // testing.map(item => output.log(`${item} -> ${predict(item, cprob, pprob)}`));
  return correct / testing.length;
}

evaluateData(true);

if (trials) {
  let trialCount = 1000;
  output.log(`Running ${trialCount} trials ...`);

  window.setTimeout(() => {
    let start = performance.now();
    let tests = range(trialCount).map(_ => evaluateData());
    output.log(`Time elapsed: ${performance.now() - start}ms\n`);

    output.log(`Min: ${Math.min(...tests)}`);
    output.log(`Max: ${Math.max(...tests)}`);
    output.log(`Avg: ${tests.reduce((t, i) => t + i) / tests.length}`);
  }, 1000);
}