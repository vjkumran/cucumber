/* eslint-env mocha */
const assert = require('assert')
const CucumberExpressionGenerator = require('../src/cucumber_expression_generator')
const Transform = require('../src/transform')
const TransformLookup = require('../src/transform_lookup')

class Currency {
}

describe(CucumberExpressionGenerator.name, () => {

  let transformLookup, generator

  function assertExpression(expectedExpression, expectedArgumentNames, text) {
    const generatedExpression = generator.generateExpression(text)
    assert.deepEqual(generatedExpression.argumentNames, expectedArgumentNames)
    assert.equal(generatedExpression.source, expectedExpression)
  }

  beforeEach(() => {
    transformLookup = new TransformLookup()
    generator = new CucumberExpressionGenerator(transformLookup)
  })

  it("documents expression generation", () => {
    const transformLookup = new TransformLookup()
    /// [generate-expression]
    const generator = new CucumberExpressionGenerator(transformLookup)
    const undefinedStepText = "I have 2 cucumbers and 1.5 tomato"
    const generatedExpression = generator.generateExpression(undefinedStepText)
    assert.equal(generatedExpression.source, "I have {int} cucumbers and {float} tomato")
    assert.equal(generatedExpression.argumentNames[0], 'int')
    assert.equal(generatedExpression.transforms[1].typeName, 'float')
    /// [generate-expression]
  })

  it("generates expression for no args", () => {
    assertExpression("hello", [], "hello")
  })

  it("generates expression for int float arg", () => {
    assertExpression(
      "I have {int} cukes and {float} euro", ["int", "float"],
      "I have 2 cukes and 1.5 euro")
  })

  it("generates expression for just int", () => {
    assertExpression(
      "{int}", ["int"],
      "99999")
  })

  it("numbers only second argument when builtin type is not reserved keyword", () => {
    assertExpression(
      "I have {float} cukes and {float} euro", ["float", "float2"],
      "I have 2.5 cukes and 1.5 euro")
  })

  it("generates expression for custom type", () => {
    transformLookup.addTransform(new Transform(
      'currency',
      Currency,
      '[A-Z]{3}',
      null
    ))

    assertExpression(
      "I have a {currency} account", ["currency"],
      "I have a EUR account")
  })

  it("prefers leftmost match when there is overlap", () => {
    transformLookup.addTransform(new Transform(
      'currency',
      Currency,
      'cd',
      null
    ))
    transformLookup.addTransform(new Transform(
      'date',
      Date,
      'bc',
      null
    ))

    assertExpression(
      "a{date}defg", ["date"],
      "abcdefg")
  })

  it("exposes transforms in generated expression", () => {
    const expression = generator.generateExpression("I have 2 cukes and 1.5 euro")
    const typeNames = expression.transforms.map(transform => transform.typeName)
    assert.deepEqual(typeNames, ['int', 'float'])
  })
})
