import BackgroundLogo from "../../src/components/Background";
import { mount } from "cypress/react";

describe("Test BackgroundLogo", () => {
  it("default 30 logos", () => {
    mount(<BackgroundLogo />);
    cy.get('img[alt="bg-logo"]').should("have.length", 30);
  });
  it("custom number of logos", () => {
    mount(<BackgroundLogo count={10} />);
    cy.get('img[alt="bg-logo"]').should("have.length", 10);
  });
  it("absolute position and random styles", () => {
    mount(<BackgroundLogo count={5} />);
    cy.get('img[alt="bg-logo"]').each(($el) => {
      const style = getComputedStyle($el[0]);
      expect(style.position).to.equal("absolute");
      expect(parseFloat(style.opacity)).to.be.within(0.05, 0.2);
      expect(parseFloat(style.width)).to.be.within(40, 80);
      expect(parseFloat(style.height)).to.be.within(40, 80);
    });
  });
  it("pointer events", () => {
    mount(<BackgroundLogo count={1} />);
    cy.get('img[alt="bg-logo"]').should("have.css", "pointer-events", "none");
  });
});
