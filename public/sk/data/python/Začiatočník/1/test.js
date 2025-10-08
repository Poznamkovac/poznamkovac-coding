async function test(context) {
  const stdout = context.stdout || "";

  return [
    {
      name: "Kontrola výstupu",
      passed: stdout.toLowerCase().includes("hello, world"),
      error: stdout.toLowerCase().includes("hello, world")
        ? undefined
        : `Očakávany výstup "Hello, World!", ale dostal som: "${stdout}"`,
    },
  ];
}
