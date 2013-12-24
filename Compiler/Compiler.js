/* 
    Lich.js - JavaScript audio/visual live coding language
    Copyright (C) 2012 Chad McKinney

	"http://chadmckinneyaudio.com/
	seppukuzombie@gmail.com

	LICENSE
	=======

	Licensed under the Simplified BSD License:

	Redistribution and use in source and binary forms, with or without
	modification, are permitted provided that the following conditions are met: 

	1. Redistributions of source code must retain the above copyright notice, this
	   list of conditions and the following disclaimer. 
	2. Redistributions in binary form must reproduce the above copyright notice,
	   this list of conditions and the following disclaimer in the documentation
	   and/or other materials provided with the distribution. 

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
	ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
	WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
	DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
	ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
	(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
	LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
	ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
	SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

	The views and conclusions contained in the software and documentation are those
	of the authors and should not be interpreted as representing official policies, 
	either expressed or implied, of the FreeBSD Project.
*/

// The Lich.js compiler traverse the abstract syntax tree returned by the parser and calls native JavaScript
Lich.compileAST = function(ast)
{
	if(ast instanceof Array)
	{
		var res = null;
		for(var i = 0; i < ast.length; ++i)
		{	
			res = Lich.compileAST(ast[i]);

			if(i < ast.length - 1)
				Lich.VM.Print(res);
		}

		return res;
	}

	else if(ast instanceof Object)
	{
		/*
		if (typeof ast === "function")
		{
			Lich.post("AST FUNCTION?!: " + ast);
			return; // Do nothing, this is a tail end function given by the parser we don't need.
		}*/

		// Lich.post("AST name: " + ast.astType);
		// Lich.post(ast);

		switch(ast.astType)
		{
			case "primitive":
				return ast();
				break;
			case "thunk":
				return Lich.compileDeclThunk(ast);
				break
			case "decl-fun":
				return Lich.compileDeclFun(ast);
				break;
			case "fun-where":
				return Lich.compileFunWhere(ast);
				break;
			case "ite":
				return Lich.compileIte(ast);
				break;
			case "application":
				return Lich.compileApplication(ast);
				break;
			case "function-application-op":
				return Lich.compileFunctionApplicationOp(ast);
				break;
			case "function-composition":
				return Lich.compileFunctionComposition(ast);
			case "lambda":
				return Lich.compileLambda(ast);
				break;
			case "let":
				return Lich.compileLet(ast);
				break;
			case "let-one": // ghci style let expression for global definitions
				return Lich.compileLetOne(ast);
				break;
			case "listexp":
				return Lich.compileListExp(ast);
				break;
			case "qop":
				return Lich.compileQop(ast);
				break;
			case "conpat":
				return Lich.compileConPat(ast);
				break;
			case "wildcard":
				return { lichType: WILDCARD };
				break;
			case "integer-lit":
				return Lich.compileIntegerLit(ast);
				break;
			case "string-lit":
				return Lich.compileStringLit(ast);
				break;
			case "char-lit":
				return Lich.compileCharLit(ast);
				break;
			case "number":
			case "float-lit":
				return Lich.compileFloatLit(ast);
				break;
			case "varname":
				return Lich.compileVarName(ast);
				break;
			case "dacon":
				return Lich.compileDacon(ast);
				break;
			case "boolean-lit":
				return Lich.compileBooleanLit(ast);
				break;
			case "binop-exp":
				return Lich.compileBinOpExp(ast);
				break;
			case "negate":
				return Lich.compileNegate(ast);
				break;
			case "listrange":
				return Lich.compileListRange(ast);
				break;
			case "dictionary":
				return Lich.compileDictionary(ast);
				break;
			case "case":
				return Lich.compileCase(ast);
				break;
			case "Nothing":
				return Lich.VM.Nothing;
				break;
			case "list-comprehension":
				return Lich.compileListComprehension(ast);
				break;
			case "module":
				return Lich.compileModule(ast);
				break;
			case "body":
				return Lich.compileBody(ast);
				break;
			case "data-decl":
				return Lich.compileDataDecl(ast);
				break;
			case "data-inst":
				return Lich.compileDataInst(ast);
				break;
			case "data-lookup":
				return Lich.compileDataLookup(ast);
				break;
			case "data-update":
				return Lich.compileDataUpdate(ast);
				break;
			case "data-enum":
				return Lich.compileDataEnum(ast);
				break;
			case "topdecl-decl":
				return Lich.compileTopdeclDecl(ast);
				break;	
			default:
				Lich.unsupportedSemantics(ast);
				break;
		}
	}

	else
	{
		Lich.post("Unknown AST Type: " + (typeof ast));
	}
}

Lich.unsupportedSemantics = function(ast)
{
	throw new Error("Unsupported semantics for " +ast+" with type "+ ast.astType);
}

Lich.compileModule = function(ast)
{
	Lich.post("Compiling module: " + ast.modid);
	Lich.compileAST(ast.body);
	Lich.post("Done compiling module: " + ast.modid);
	return Lich.VM.Void;
}

Lich.compileBody = function(ast)
{
	for(var i = 0; i < ast.topdecls.length; ++i)
	{
		Lich.compileAST(ast.topdecls[i]);
	}
}

Lich.compileTopdeclDecl = function(ast)
{
	return Lich.compileAST(ast.decl);
}

Lich.compileTopdeclData = function(ast)
{
	Lich.unsupportedSemantics(ast);
}

Lich.compileDeclFun = function(ast)
{
	if(ast.args.length == 0)
	{
		var res = Lich.compileAST(ast.rhs);
		Lich.VM.setVar(ast.ident, res);
		return res;
	}

	else
	{
		var closure = new lichClosure(ast.args, ast.rhs);
		Lich.VM.setVar(ast.ident, closure);
		return closure;
	}
}

Lich.compileDeclThunk = function(ast)
{
	if(ast.args.length == 0)
	{
		var thunk = new lichClosure([], ast.rhs);
		Lich.VM.setVar(ast.ident, thunk);
		thunk.lichType = THUNK;
		return thunk;
	}

	else
	{
		var closure = new lichClosure(ast.args, ast.rhs);
		Lich.VM.setVar(ast.ident, closure);
		return closure;
	}
}

Lich.compileFunWhere = function(ast)
{
	// CHECK WHERE VARS AGAINST FUNC VARS!!!!!!!!!!??????????

	for(var i = 0; i < ast.decls.length; ++i)
	{
		ast.decls[i].astType = "thunk";
	}

	return new lichClosure([], ast.exp, false, {}, ast.decls).invoke([]);
}

Lich.compileConstr = function(ast)
{
	Lich.unsupportedSemantics(ast);
}

Lich.compileInfixExp = function(ast)
{
	var res = null;

	for(var i = 0; i < ast.exps.length; ++i)
	{
		res = Lich.compileAST(ast.exps[i]);
	}

	return res;
}

Lich.compileIte = function(ast)
{
	var expRes = Lich.compileAST(ast.e1); 
	if(expRes === true) // explicit to avoid false positives
		return Lich.compileAST(ast.e2);
	else
		return Lich.compileAST(ast.e3);
}

Lich.compileApplication = function(ast)
{
	var closure = Lich.compileAST(ast.exps[0]);

	if(typeof closure === "undefined")
		throw new Error("Cannot invoke an undefined object");

	if(closure.lichType != CLOSURE)
	{
		throw new Error("Unable to use application on " + closure.astType);
	}

	else
	{
		var args = new Array();
		for(var i = 1; i < ast.exps.length; ++i)
		{
			args.push(Lich.compileAST(ast.exps[i]));
		}

		return closure.invoke(args);
	}
}

Lich.compileFunctionApplicationOp = function(ast)
{
	var exp1 = Lich.compileAST(ast.exp1);

	if(exp1.lichType != CLOSURE)
		throw new Error("$ can only be applied using: function $ expression");

	var exp2 = Lich.compileAST(ast.exp2);

	return exp1.invoke([exp2]);
}

Lich.compileFunctionComposition = function(ast)
{
	var funcs = new Array();

	for(var i = 0; i < ast.exps.length; ++i)
	{
		var func = Lich.compileAST(ast.exps[i]);

		if(func.lichType != CLOSURE)
			throw new Error("function composition can only be applied using: function . function");

		funcs.push(func);
	}

	var composed = composeFunction(funcs);
	return new lichClosure(["X"], composed);
}

Lich.compileLambda = function(ast)
{
	return new lichClosure(ast.args, ast.rhs);
}

Lich.compileLet = function(ast)
{
	Lich.unsupportedSemantics(ast);
}

Lich.compileLet = function(ast)
{
	for(var i = 0; i < ast.decls.length; ++i)
	{
		ast.decls[i].astType = "thunk";
	}

	return new lichClosure([], ast.exp, false, {}, ast.decls).invoke([]);
}

Lich.compileLetOne = function(ast)
{
	return Lich.compileAST(ast.decl);
}

Lich.compileListExp = function(ast)
{
	var res = new Array();

	for(var i = 0; i < ast.members.length; ++i)
	{
		res.push(Lich.compileAST(ast.members[i]));
	}

	return res;
}

Lich.compileQop = function(ast)
{
	Lich.unsupportedSemantics(ast);
}

Lich.compileConPat = function(ast)
{
	Lich.unsupportedSemantics(ast);
}

Lich.compileWildCard = function(ast)
{
	Lich.unsupportedSemantics(ast);
}

Lich.compileIntegerLit = function(ast)
{
	return ast.value;
}

Lich.compileStringLit = function(ast)
{
	return ast.value.substring(1, ast.value.length - 1);
}

Lich.compileCharLit = function(ast)
{
	return ast.value.substring(1, ast.value.length - 1);
}

Lich.compileFloatLit = function(ast)
{
	return ast.value;
}

Lich.compileVarName = function(ast)
{
	return Lich.VM.getVar(ast.id);
}

Lich.compileDacon = function(ast)
{
	if(ast == "Nothing")
		return Lich.VM.Nothing;
	else
		Lich.unsupportedSemantics({astType:ast});
}

Lich.compileDataDecl = function(ast)
{
	var data = {
		_argNames: new Array(),
		_datatype: ast.id,
		lichType: DATA
	}

	for(var i = 0; i < ast.members.length; ++i)
	{
		data._argNames.push(ast.members[i].id);
		data[ast.members[i].id] = Lich.compileAST(ast.members[i].exp);
	}

	Lich.VM.setVar(ast.id, data);
	return data;
}

Lich.compileDataInst = function(ast)
{
	var dataCon = Lich.VM.getVar(ast.id);

	if(dataCon == Lich.VM.Nothing)
		throw new Error("Unable to find data constructor for " + ast.id);

	var data = deepCopy(dataCon);

	if(dataCon._argNames.length < ast.members.length)
		throw new Error("Too many arguments for data constructor " + ast.id);

	for(var i = 0; i < ast.members.length; ++i)
	{
		data[dataCon._argNames[i]] = Lich.compileAST(ast.members[i]);
	}

	return data;
}

Lich.compileDataLookup = function(ast)
{
	var data = Lich.compileAST(ast.data);

	if(data.lichType != DATA)
		throw new Error("Unable to find data constructor");

	var res = data[ast.member];

	if(typeof res === "undefined")
		throw new Error("Data constructor " + data._datatype + " does not contain member " + ast.member);

	return res;	
}

Lich.compileDataUpdate = function(ast)
{
	var dataCon = Lich.compileAST(ast.data);

	if(dataCon == Lich.VM.Nothing)
		throw new Error("Unable to find data object for update");

	var data = deepCopy(dataCon);

	for(var i = 0; i < ast.members.length; ++i)
	{
		data[ast.members[i].id] = Lich.compileAST(ast.members[i].exp);
	}

	return data;
}

Lich.compileDataEnum = function(ast)
{
	var data = {
		_argNames: new Array(),
		_datatype: ast.id,
		lichType: DATA
	}

	for(var i = 0; i < ast.members.length; ++i)
	{
		data._argNames.push(ast.members[i]);
		data[ast.members[i]] = i;
	}

	Lich.VM.setVar(ast.id, data);
	return data;
}

Lich.compileBooleanLit = function(ast)
{
	return ast.value;
}

Lich.compileBinOpExp = function(ast)
{
	var op = Lich.VM.getVar(ast.op); // Lookup function for operator

	if(op == Lich.VM.Nothing)
		throw new Error("Binary Operator not found: " + ast.op);

	return op.invoke([Lich.compileAST(ast.lhs), Lich.compileAST(ast.rhs)]);
}

Lich.compileNegate = function(ast)
{ 
	return Lich.VM.getVar("subtract").invoke([0, Lich.compileAST(ast.rhs)]);
}

Lich.compileListRange = function(ast)
{
	var lower = Lich.compileAST(ast.lower);
	var upper = Lich.compileAST(ast.upper);
	var skip = 0;

	if(typeof ast.skip == "undefined")
	{
		if(lower < upper)
			skip = 1;
		else
			skip = -1;
	}
	
	else
	{
		skip = Lich.compileAST(ast.skip) - lower;
	}

	if(typeof lower !== "number" || typeof skip !== "number" || typeof skip !== "number")
		throw new Error("List range syntax can only be used with numbers.");

	var array = new Array();

	if(skip <= 0)
	{
		for(var i = lower; i >= upper; i += skip)
		{
			array.push(i);
		}

		return array;
	}

	else
	{
		for(var i = lower; i <= upper; i += skip)
		{
			array.push(i);
		}

		return array;
	}
}

Lich.compileDictionary = function(ast)
{
	var dict = {lichType: DICTIONARY};
	
	for(var i = 0; i < ast.pairs.length; i += 2)
	{
		dict[Lich.compileAST(ast.pairs[i])] = Lich.compileAST(ast.pairs[i+1]);
	}

	return dict;
}

Lich.compileCase = function(ast)
{
	var exp = Lich.compileAST(ast.exp);

	for(var i = 0; i < ast.alts.length; ++i)
	{
		var pat = Lich.compileAST(ast.alts[i].pat);

		if(pat.lichType == WILDCARD || pat == exp)
			return Lich.compileAST(ast.alts[i].exp);
	}

	return Lich.VM.Nothing;
}

Lich.compileListComprehension = function(ast)
{
	var closure = new lichClosure([], ast.exp);
	var generatorScope = {}
	var generatorLoop = new Array();
	var res = new Array();
	var filters = new Array();

	// First we collect all the filter functions
	for(var i = 0; i < ast.generators.length; ++i)
	{
		if(ast.generators[i].astType != "decl-fun")
			filters.push(ast.generators[i]);
	}

	// Collect all the lists from the generators
	for(var i = 0; i < ast.generators.length; ++i)
	{
		if(ast.generators[i].astType == "decl-fun")
		{
			var list = Lich.compileAST(ast.generators[i].rhs);

			if(!(list instanceof Array))
				throw new Error("List comprehensions can only be created with list generators and boolean expressions such as: [x | x <- [1..9], x /= 3]");

			generatorScope[ast.generators[i].ident] = list;
			generatorLoop.push(ast.generators[i].ident);
		}
	}

	res = new Array();

	// Then iterate over the lists, creating all the combinations of the lists and applying the filters to each item.
	var nestLoop = function(nI, nScope) // recusrive nested looping over each list from the generators
	{
		var loopID = generatorLoop[nI];
		var currentList = generatorScope[loopID];
		var scope = typeof nScope !== "undefined" ? nScope : {};

		for(var j = 0; j < currentList.length; ++j)
		{
			scope[loopID] = currentList[j];

			if(nI < generatorLoop.length - 1)
			{
				nestLoop(nI + 1, scope);
			}

			else
			{
				closure = new lichClosure([], ast.exp, false, scope);
				var temp = closure.invoke([]);
				var collect = true;

				for(var k = 0; k < filters.length; ++k)
				{
					var filterClosure = new lichClosure([], filters[k], false, scope);
					
					if(!filterClosure.invoke([]))
					{
						collect = false;
						break;
					}
				}

				if(collect)
					res.push(temp);
			}	
		}
	}
	
	nestLoop(0);
	return res;
}