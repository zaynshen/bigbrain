/* eslint-disable no-undef */

const DEFAULT_THUMBNAIL =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSlrZqTCInyg6RfYC7Ape20o-EWP1EN_A8fOA&s";

// generate email
const generateEmail = () => {
  const timestamp = new Date().getTime();
  return `test_user_${timestamp}@example.com`;
};
//test data
const TEST_USER = {
  name: "Tester",
  email: generateEmail(),
  password: "thisispassword",
};
const TEST_GAME = {
  name: "NewGame",
  description: "this is a Q&A game",
  thumbnail: DEFAULT_THUMBNAIL,
};

describe("Auth Login UI Test", () => {
  // Before start test we need to restore local storage
  beforeEach(() => {
    cy.restoreLocalStorage();
  });
  // save local storage.
  afterEach(() => {
    cy.saveLocalStorage();
  });
  it("Login UI Test", () => {
    //visit login page
    cy.visit("/login");
    cy.url().should("include", "/login");

    // check conponents
    cy.contains("Login").should("be.visible");

    // To register page
    cy.contains("Register now").click();
    cy.url().should("include", "/register");

    // register
    cy.get('input[id="register-form_email"]').type(TEST_USER.email);
    cy.get('input[id="register-form_name"]').type(TEST_USER.name);
    cy.get('input[id="register-form_password"]').type(TEST_USER.password);
    cy.get('input[id="register-form_confirmPassword"]').type(
      TEST_USER.password
    );
    cy.contains("button", "Register").click();

    // to dashboard
    cy.url().should("include", "/Dashboard", { timeout: 10000 });
    cy.contains("BigBrain").should("be.visible");

    // create game
    cy.contains("Create Game").click();
    cy.get(".ant-modal-content").should("be.visible");
    // input game info
    cy.get('input[id="title"]').type(TEST_GAME.name);
    cy.get('textarea[id="description"]').type(TEST_GAME.description);
    // submit
    cy.contains("Submit").click();

    // check create success
    cy.contains("Game Created Successfully!").should("be.visible");
    cy.contains(TEST_GAME.name).should("be.visible");

    //setting question
    // click edit
    cy.get(".ant-card").first().find(".anticon-edit").click();
    cy.contains("Questions").should("be.visible");
    //add question
    cy.contains("Add Question").click();
    cy.get(".ant-modal-content").should("be.visible");
    //input quetion info
    cy.get('[data-cy="add-question-input"]').type(
      "Where is the Australian Open held?"
    );
    cy.get(".ant-select").click();
    cy.contains("Single Choice Question").click();
    cy.contains("Submit").click();
    //edit question
    cy.get(".ant-card").first().find(".anticon-setting").click();
    cy.contains("Question Settings").should("be.visible");
    cy.get('input[id="score"]').clear().type("10");
    cy.get('input[id="duration"]').clear().type("10");
    //option
    cy.contains("Add Option").click();
    cy.contains("Add Option").click();
    cy.get('input[placeholder="Option 1"]').clear().type("Sydney");
    cy.get('input[placeholder="Option 2"]').clear().type("Melbourne");
    cy.contains("Add Option").click();
    cy.contains("Add Option").click();
    cy.get('input[placeholder="Option 3"]').clear().type("Perth");
    cy.get('input[placeholder="Option 4"]').clear().type("Canberra");
    cy.get(".ant-switch").eq(2).click();
    //save
    cy.contains("Save Changes").click();
    cy.contains("Changes saved successfully!").should("be.visible");
    //back to dashboard
    cy.contains("Back").click();
    cy.url().should("include", "/dashboard");

    // start game
    cy.get(".ant-card").first().find(".anticon-play-circle").click();
    cy.contains("Game Session Started").should("be.visible");
    cy.contains("Close").click();
    // to Gamepage
    cy.get(".ant-card").first().contains("Enter Game").click();
    cy.url().should("include", "/play/");
    cy.contains("Game Lobby (Admin)").should("be.visible");
    cy.contains("Players Joined").should("contain.text", "0");
    // Start answer question
    cy.contains("Start Game").click();
    cy.get('[data-cy="next-step"]').click();

    cy.get("body").then(($body) => {
      if ($body.text().includes("Advanced to next question")) {
        cy.contains("Advanced to next question").should("be.visible");
      } else if ($body.text().includes("Game started!")) {
        cy.contains("Game started!").should("be.visible");
      } else if ($body.text().includes("Game finished!")) {
        cy.contains("Game finished!").should("be.visible");
      } else if ($body.text().includes("Failed to mutate game")) {
        throw new Error("Backend mutation failed");
      } else {
        cy.log("No feedback found");
      }
    });
    //Back Dashboard
    cy.contains("BackToDashboard").click();
    cy.url().should("include", "/dashboard");
    //Logout
    cy.get('[data-cy="user-dropdown"]').click();
    cy.get(".ant-dropdown-menu-item").contains("Logout").click();
    cy.contains("Logout Successfully!").should("be.visible");
    cy.url().should("include", "/login");
    // login again
    cy.get('input[id="login-form_email"]').type(TEST_USER.email);
    cy.get('input[id="login-form_password"]').type(TEST_USER.password);
    cy.contains("button", "Login").click();
    cy.url().should("include", "/Dashboard");
    cy.contains(TEST_GAME.name).should("be.visible");
  });
});
