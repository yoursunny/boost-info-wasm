// @ts-check

const test = require("ava").default;
const BoostInfo = require(".");

test("debugSettings", async (t) => {
  // https://www.boost.org/doc/libs/1_73_0/doc/html/property_tree/tutorial.html
  const tree = await BoostInfo.load(`
    debug
    {
        filename debug.log
        modules
        {
            module Finance
            module Admin
            module HR
        }
        level 2
    }
  `);
  t.is(tree.get("debug.filename"), "debug.log");
  t.is(tree.get("debug.level"), "2");
  const expectedModuleValues = ["Finance", "Admin", "HR"];
  tree.forEach("debug.modules.module", (node, i) => {
    t.is(node.get(), expectedModuleValues[i]);
    t.is(node.value, expectedModuleValues[i]);
  });
  t.deepEqual(tree.map("debug.modules.module", (node) => node.value), expectedModuleValues);
  tree.dispose();
});

test("typical", async (t) => {
  // https://www.boost.org/doc/libs/1_73_0/doc/html/property_tree/parsers.html#property_tree.parsers.info_parser
  const tree = await BoostInfo.load(`
    key1 value1
    key2
    {
      key3 value3
      {
          key4 "value4 with spaces"
      }
      key5 value5
    }
  `);
  t.is(tree.get("key1"), "value1");
  t.is(tree.get("key2.key3"), "value3");
  t.is(tree.get("key2.key3.key4"), "value4 with spaces");
  t.is(tree.get("key2.key5"), "value5");
  tree.dispose();
});

test("complicated", async (t) => {
  // https://www.boost.org/doc/libs/1_73_0/doc/html/property_tree/parsers.html#property_tree.parsers.info_parser
  const tree = await BoostInfo.load(`
    ; A comment
    key1 value1   ; Another comment
    key2 "value with special characters in it {};#\\n\\t\\"\\0"
    {
      subkey "value split "\\
              "over three"\\
              "lines"
      {
          a_key_without_value ""
          "a key with special characters in it {};#\\n\\t\\"\\0" ""
          "" value    ; Empty key with a value
          "" ""       ; Empty key with empty value!
      }
    }
  `);
  t.is(tree.get("undefined"), undefined);
  t.is(tree.get("key1"), "value1");
  t.is(tree.get("key2"), "value with special characters in it {};#\n\t\""); // \0 is lost
  t.is(tree.get("key2.subkey"), "value split over threelines");
  // \0 in key is not supported
  t.is(tree.get("key2.subkey.a_key_without_value"), "");
  t.deepEqual(tree.map("key2.subkey.", ({ value }) => value), ["value", ""]);
  tree.dispose();
});
