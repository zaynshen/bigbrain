import { BrowserRouter } from "react-router-dom";
import CardGird from "../../src/components/cardgird";

/**
 *  start test
 */
describe("Test CardGird Component", () => {
  beforeEach(function () {
    cy.fixture("games.json").then((gamesData) => {
      this.games = gamesData;
      console.log("Loaded games data:", this.games);
    });
    // email
    localStorage.setItem("email", "zayn@163.com");
  });
  //test fetch
  it("renders a list of slides", function () {
    console.log("Games data in test:", this.games);
    cy.wrap(this.games)
      .should("not.be.undefined")
      .then(() => {
        cy.mount(
          <BrowserRouter initialEntries={["/dashboard"]}>
            <CardGird games={this.games} onDelete={() => {}} />
          </BrowserRouter>
        );

        // Check that the slides are rendered
        cy.get(".ant-card").should("have.length", this.games.length);

        // Verify first slide
        cy.get(".ant-card")
          .eq(0)
          .within(() => {
            cy.get(".ant-card-meta-title").should("have.text", "Fun");
            cy.contains("Questions:");
          });

        // Verify second slide
        cy.get(".ant-card")
          .eq(1)
          .within(() => {
            cy.contains("Nice");
          });
        // router
        cy.get(".ant-card")
          .eq(0)
          .within(() => {
            cy.get(".anticon-edit").click();
            // to setting
            cy.url().should("include", `/game/${this.games[0].id}`);
          });
      });
  });
});
