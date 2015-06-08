import React from "react/addons"; 
var TestUtils = React.addons.TestUtils;
jest.dontMock("../../../app/components/Account/Identicon.jsx");

describe("<Identicon>", function() {
    var Identicon = require("../../../app/components/Account/Identicon.jsx");
    var identicon, result;
    var size = {height: 100, width: 100};

    beforeEach(function() {
        identicon = TestUtils.renderIntoDocument(
            <Identicon account="Identicon" size={size}/>
        );
        result = TestUtils.findRenderedDOMComponentWithTag(
            identicon, "canvas");
    });

    it("renders a canvas when given an account name", function() {
        expect(typeof result).toBe("object");
    }); 

    it("only renders divs when given undefined account name", function() {
        var divicon = TestUtils.renderIntoDocument(
            <Identicon account={undefined} size={size}/>
        );
        var divs = TestUtils.scryRenderedDOMComponentsWithTag(
            divicon, "div");
        var canvas = TestUtils.scryRenderedDOMComponentsWithTag(
            divicon, "canvas");
        expect(divs.length === 2 && canvas.length === 0).toBeTruthy();
    });

    it("has props style of width/height equal to size", function() {
        expect(result.props.style.width === size.width && result.props.style.height === size.height).toBeTruthy();
    }); 

    it("has props of width/height equal to 2 * size", function() {
        expect(result.props.width === size.width * 2 && result.props.height === size.height * 2).toBeTruthy();
    }); 
});

