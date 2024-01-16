// @ts-check

import assert from "node:assert/strict";
import { test } from "node:test";

import * as BoostInfo from "./main.js";

/**
 * @param {BoostInfo.Tree} tree
 * @returns {void}
 */
function checkDebugSettings(tree) {
  assert.equal(tree.get("debug.filename"), "debug.log");
  assert.equal(tree.get("debug.level"), "2");
  const expectedModuleValues = ["Finance", "Admin", "HR"];
  let n = 0;
  tree.forEach("debug.modules.module", (node, i) => {
    assert.equal(node.get(), expectedModuleValues[i]);
    assert.equal(node.value, expectedModuleValues[i]);
    ++n;
  });
  assert.equal(n, expectedModuleValues.length);
  assert.deepEqual(tree.map("debug.modules.module", (node) => node.value), expectedModuleValues);
}

test("debugSettings", async () => {
  // https://www.boost.org/doc/libs/1_73_0/doc/html/property_tree/tutorial.html
  const tree0 = await BoostInfo.load(`
    <debug>
      <filename>debug.log</filename>
      <modules>
        <module>Finance</module>
        <module>Admin</module>
        <module>HR</module>
      </modules>
      <level>2</level>
    </debug>
  `, BoostInfo.Format.XML);
  checkDebugSettings(tree0);
  const info0 = tree0.save(BoostInfo.Format.INFO);
  assert(info0);

  const tree1 = await BoostInfo.load(`
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
  `, BoostInfo.Format.INFO);
  checkDebugSettings(tree1);
  const xml1 = tree1.save(BoostInfo.Format.XML);
  assert(xml1);

  const tree2 = await BoostInfo.load(info0, BoostInfo.Format.INFO);
  checkDebugSettings(tree2);
  const tree3 = await BoostInfo.load(xml1, BoostInfo.Format.XML);
  checkDebugSettings(tree3);

  tree0.dispose();
  tree1.dispose();
  tree2.dispose();
  tree3.dispose();
});

test("typical", async () => {
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
  assert.equal(tree.get("key1"), "value1");
  assert.equal(tree.get("key2.key3"), "value3");
  assert.equal(tree.get("key2.key3.key4"), "value4 with spaces");
  assert.equal(tree.get("key2.key5"), "value5");
  tree.dispose();
});

test("complicated", async () => {
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
  assert.equal(tree.get("undefined"), undefined);
  assert.equal(tree.get("key1"), "value1");
  assert.equal(tree.get("key2"), "value with special characters in it {};#\n\t\"\0");
  assert.equal(tree.get("key2.subkey"), "value split over threelines");
  // \0 in key is not supported
  assert.equal(tree.get("key2.subkey.a_key_without_value"), "");
  assert.deepEqual(tree.map("key2.subkey.", ({ value }) => value), ["value", ""]);
  tree.dispose();
});
