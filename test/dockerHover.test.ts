/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as assert from "assert";

import { TextDocument, Hover, Position } from 'vscode-languageserver';
import { MarkdownDocumentation } from '../src/dockerMarkdown';
import { DockerHover } from '../src/dockerHover';

let markdownDocumentation = new MarkdownDocumentation();
let hoverProvider = new DockerHover(markdownDocumentation);

function createDocument(content: string): any {
	return TextDocument.create("uri://host/Dockerfile.sample", "dockerfile", 1, content);
}

function onHover(document: TextDocument, line: number, character: number): Hover | null {
	let textDocumentPosition = {
		textDocument: {
			uri: document.uri
		},
		position: Position.create(line, character)
	};
	return hoverProvider.onHover(document, textDocumentPosition);
}

describe("Dockerfile hover", function() {
	describe("whitespace", function() {
		it("empty file", function() {
			let document = createDocument("");
			let hover = onHover(document, 0, 0);
			assert.equal(hover, null);
		});

		it("spaces", function() {
			let document = createDocument("    ");
			let hover = onHover(document, 0, 2);
			assert.equal(hover, null);
		});

		it("tabs", function() {
			let document = createDocument("\t\t\t\t");
			let hover = onHover(document, 0, 2);
			assert.equal(hover, null);
		});
	});

	describe("comments", function() {
		it("# FROM node", function() {
			let document = createDocument("3");
			let hover = onHover(document, 0, 0);
			assert.equal(hover, null);
		});
	});

	describe("directives", function() {
		it("escape", function() {
			let document = createDocument("#escape=`");
			let hover = onHover(document, 0, 4);
			assert.equal(hover, markdownDocumentation.getMarkdown("escape"));

			document = createDocument("# escape=`");
			hover = onHover(document, 0, 1);
			assert.equal(hover, null);
		});

		it("invalid directive definition", function() {
			let document = createDocument("#eskape=`");
			let hover = onHover(document, 0, 4);
			assert.equal(hover, null);

			document = createDocument("#escape ");
			hover = onHover(document, 0, 4);
			assert.equal(hover, null);

			document = createDocument("#escape=");
			hover = onHover(document, 0, 4);
			assert.equal(hover, markdownDocumentation.getMarkdown("escape"));

			document = createDocument("#escape=ab");
			hover = onHover(document, 0, 4);
			assert.equal(hover, markdownDocumentation.getMarkdown("escape"));

			document = createDocument("#escape\t");
			hover = onHover(document, 0, 4);
			assert.equal(hover, null);

			document = createDocument("#escape\r\n");
			hover = onHover(document, 0, 4);
			assert.equal(hover, null);

			document = createDocument("#escape\n");
			hover = onHover(document, 0, 4);
			assert.equal(hover, null);

			document = createDocument("\n#escape");
			hover = onHover(document, 1, 4);
			assert.equal(hover, null);

			document = createDocument("\r#escape");
			hover = onHover(document, 1, 4);
			assert.equal(hover, null);

			document = createDocument("\r\n#escape");
			hover = onHover(document, 1, 4);
			assert.equal(hover, null);
		});
	});

	describe("keywords", function() {
		it("FROM", function() {
			let document = createDocument("FROM node");
			let hover = onHover(document, 0, 2);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));
		});

		it("froM", function() {
			let document = createDocument("froM node");
			let hover = onHover(document, 0, 2);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));
		});

		it("fr\\\\noM", function() {
			let document = createDocument("fr\\\noM node");
			let hover = onHover(document, 0, 0);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));

			hover = onHover(document, 0, 1);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));

			hover = onHover(document, 1, 1);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));

			hover = onHover(document, 1, 1);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));
		});

		it("fr\\\\roM", function() {
			let document = createDocument("fr\\\roM node");
			let hover = onHover(document, 0, 0);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));

			hover = onHover(document, 0, 1);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));

			hover = onHover(document, 1, 1);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));

			hover = onHover(document, 1, 1);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));
		});

		it("fr\\\\r\\noM", function() {
			let document = createDocument("fr\\\r\noM node");
			let hover = onHover(document, 0, 0);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));

			hover = onHover(document, 0, 1);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));

			hover = onHover(document, 1, 1);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));

			hover = onHover(document, 1, 1);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));
		});

		it("HEALTHCHECK NONE", function() {
			let document = createDocument("HEALTHCHECK NONE");
			let hover = onHover(document, 0, 14);
			assert.equal(hover, null);
		});

		it("newlines", function() {
			let document = createDocument("FROM node\nEXPOSE 8081");
			let hover = onHover(document, 1, 4);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));

			document = createDocument("FROM node\rEXPOSE 8081");
			hover = onHover(document, 1, 4);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));

			document = createDocument("FROM node\r\nEXPOSE 8081");
			hover = onHover(document, 1, 4);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));
		});

		it("invalid escape", function() {
			let document = createDocument("FR\\OM node");
			let hover = onHover(document, 0, 1);
			assert.equal(hover, null);

			hover = onHover(document, 0, 3);
			assert.equal(hover, null);
		});

		describe("ARG", function() {
			it("variable name", function() {
				let document = createDocument("ARG z=y");
				let hover = onHover(document, 0, 5);
				assert.equal(hover.contents, "y");

				document = createDocument("ARG e='f g=h'");
				hover = onHover(document, 0, 5);
				assert.equal(hover.contents, "f g=h");

				document = createDocument("ARG x=\"v v=w\"");
				hover = onHover(document, 0, 5);
				assert.equal(hover.contents, "v v=w");
			});

			it("variable value", function() {
				let document = createDocument("ARG z=y");
				let hover = onHover(document, 0, 6);
				assert.equal(hover, null);
			});

			it("no variable value", function() {
				let document = createDocument("ARG z");
				let hover = onHover(document, 0, 5);
				assert.equal(hover, null);
			});

			it("escaped", function() {
				let document = createDocument("ARG \\ \t\nz=y");
				let hover = onHover(document, 1, 0);
				assert.equal(hover.contents, "y");

				document = createDocument("ARG \\ \t\rz=y");
				hover = onHover(document, 1, 0);
				assert.equal(hover.contents, "y");

				document = createDocument("ARG \\ \t\r\nz=y");
				hover = onHover(document, 1, 0);
				assert.equal(hover.contents, "y");

				document = createDocument("ARG z=y \\ \t\n \t");
				hover = onHover(document, 0, 5);
				assert.equal(hover.contents, "y");

				document = createDocument("ARG z=y \\ \t\r \t");
				hover = onHover(document, 0, 5);
				assert.equal(hover.contents, "y");

				document = createDocument("ARG z=y \\ \t\r\n \t");
				hover = onHover(document, 0, 5);
				assert.equal(hover.contents, "y");

				document = createDocument("ARG z=\\\ny");
				hover = onHover(document, 0, 5);
				assert.equal(hover.contents, "y");

				document = createDocument("ARG z=\\\n'y'");
				hover = onHover(document, 0, 5);
				assert.equal(hover.contents, "y");

				document = createDocument("ARG z=\\\n\"y\"");
				hover = onHover(document, 0, 5);
				assert.equal(hover.contents, "y");
			});

			it("no variable", function() {
				let document = createDocument("ARG    ");
				let hover = onHover(document, 0, 5);
				assert.equal(hover, null);
			});

			it("referenced variable ${var}", function() {
				let document = createDocument("ARG var=value\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}");
				let hover = onHover(document, 1, 13);
				assert.equal(hover.contents, "value");
				hover = onHover(document, 2, 7);
				assert.equal(hover.contents, "value");
				hover = onHover(document, 3, 11);
				assert.equal(hover.contents, "value");
			});

			it("referenced variable ${var} no value", function() {
				let document = createDocument("ARG var\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}");
				let hover = onHover(document, 1, 13);
				assert.equal(hover, null);
				hover = onHover(document, 2, 7);
				assert.equal(hover, null);
				hover = onHover(document, 3, 11);
				assert.equal(hover, null);
			});

			it("referenced variable $var", function() {
				let document = createDocument("ARG var=value\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var");
				let hover = onHover(document, 1, 13);
				assert.equal(hover.contents, "value");
				hover = onHover(document, 2, 7);
				assert.equal(hover.contents, "value");
				hover = onHover(document, 3, 11);
				assert.equal(hover.contents, "value");
			});

			it("referenced variable $var no value", function() {
				let document = createDocument("ARG var\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var");
				let hover = onHover(document, 1, 13);
				assert.equal(hover, null);
				hover = onHover(document, 2, 7);
				assert.equal(hover, null);
				hover = onHover(document, 3, 11);
				assert.equal(hover, null);
			});
		});
	});

	describe("keyword nesting", function() {
		it("ONBUILD EXPOSE", function() {
			let document = createDocument("ONBUILD EXPOSE 8080");
			let hover = onHover(document, 0, 11);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));
		});

		it("ONBUILD EXPOSE escaped on newline", function() {
			let document = createDocument("ONBUILD \\\nEXPOSE 8080");
			let hover = onHover(document, 1, 3);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));

			document = createDocument("ONBUILD \\\rEXPOSE 8080");
			hover = onHover(document, 1, 3);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));

			document = createDocument("ONBUILD \\\r\nEXPOSE 8080");
			hover = onHover(document, 1, 3);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));

			document = createDocument("#escape=`\nONBUILD \\\nEXPOSE 8080");
			hover = onHover(document, 2, 3);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));
		});

		it("ONBUILD EXPOSE escaped on newline with space", function() {
			let document = createDocument("ONBUILD \\\n EXPOSE 8080");
			let hover = onHover(document, 1, 4);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));
		});

		it("ONBUILD EXPOSE incomplete", function() {
			let document = createDocument("ONBUILD EXPOSE");
			let hover = onHover(document, 0, 9);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));

			document = createDocument("ONBUILD EXPOSE\n");
			hover = onHover(document, 0, 9);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));

			document = createDocument("ONBUILD EXPOSE\r");
			hover = onHover(document, 0, 9);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));

			document = createDocument("ONBUILD EXPOSE\r\n");
			hover = onHover(document, 0, 9);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));
		});

		it("ONBUILD EXP\\OSE", function() {
			let document = createDocument("ONBUILD EXPOS\\E");
			let hover = onHover(document, 0, 9);
			assert.equal(hover, null);
		});

		it("ONBUILD with no trigger", function() {
			let document = createDocument("ONBUILD   \r\n");
			let hover = onHover(document, 0, 9);
			assert.equal(hover, null);
		});

		it("invalid nesting", function() {
			let document = createDocument("RUN EXPOSE 8080");
			let hover = onHover(document, 0, 7);
			assert.equal(hover, null);

			document = createDocument(" RUN EXPOSE 8080");
			hover = onHover(document, 0, 8);
			assert.equal(hover, null);

			document = createDocument("\tRUN EXPOSE 8080");
			hover = onHover(document, 0, 8);
			assert.equal(hover, null);

			document = createDocument("\r\nRUN EXPOSE 8080");
			hover = onHover(document, 1, 7);
			assert.equal(hover, null);

			document = createDocument("\rRUN EXPOSE 8080");
			hover = onHover(document, 1, 7);
			assert.equal(hover, null);

			document = createDocument("\nRUN EXPOSE 8080");
			hover = onHover(document, 1, 7);
			assert.equal(hover, null);
		});
	});
});
