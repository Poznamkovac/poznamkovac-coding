export default class HTMLChallengeTester {
  /** @param {Window} window */
  test_todo_list(window) {
    if (
      typeof window.addTodo !== "function" ||
      typeof window.removeTodo !== "function" ||
      typeof window.getTodos !== "function"
    ) {
      return {
        detaily_zle: "Chýbajú niektoré požadované funkcie (addTodo, removeTodo, getTodos).",
      };
    }

    window.addTodo("Prvá úloha");
    window.addTodo("Druhá úloha");
    let todos = window.getTodos();

    if (todos.length !== 2) {
      return {
        detaily_zle: "Funkcia addTodo nepridáva úlohy správne.",
      };
    }

    if (
      !todos[0].id ||
      typeof todos[0].id !== "number" ||
      !todos[0].text ||
      todos[0].text !== "Prvá úloha" ||
      todos[0].completed !== false
    ) {
      return {
        detaily_zle: "Úlohy nemajú správnu štruktúru (id, text, completed).",
      };
    }

    const idToRemove = todos[0].id;
    window.removeTodo(idToRemove);
    todos = window.getTodos();

    if (todos.length !== 1 || todos[0].text !== "Druhá úloha") {
      return {
        detaily_zle: "Funkcia removeTodo neodstraňuje úlohy správne.",
      };
    }

    return {
      skore: 4,
      detaily_ok: "Výborne! Vytvoril si funkčný Todo List s požadovanými funkciami.",
    };
  }
}
