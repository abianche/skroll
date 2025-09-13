export const SAMPLE = `{
  "variables": { "hasKey": false, "courage": 0 },
  "start": "intro",
  "nodes": [
    { "id":"intro","text":"You wake up.","choices":[
      {"text":"Search","next":"search"},
      {"text":"Knock","next":"knock"}
    ]},
    { "id":"search","text":"You find a key.","set":{"hasKey":true},"choices":[
      {"text":"Back","next":"door"}
    ]},
    { "id":"knock","text":"Silence. Courage +1.","inc":{"courage":1},"choices":[
      {"text":"Back","next":"door"}
    ]},
    { "id":"door","text":"A locked door.","choices":[
      {"text":"Use key","if":"hasKey == true","next":"open"},
      {"text":"Force it","if":"courage >= 2","next":"force"},
      {"text":"Keep knocking","next":"knock"}
    ]},
    { "id":"open","text":"Freedom.","end":true },
    { "id":"force","text":"Broken latch. Freedom.","end":true }
  ]
}`;
