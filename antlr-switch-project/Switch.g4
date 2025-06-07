grammar Switch;

program: statement* EOF;

statement
    : switchStatement
    | assignmentStatement
    | consoleStatement
    ;

switchStatement
    : 'switch' '(' expression ')' '{' caseClause* defaultClause? '}'
    ;

caseClause
    : 'case' expression ':' statement*
    ;

defaultClause
    : 'default' ':' statement*
    ;

assignmentStatement
    : Identifier '=' expression ';'
    ;

consoleStatement
    : 'console' '.' 'log' '(' expression ')' ';'
    ;

expression
    : term (('+' | '-') term)*
    ;

term
    : Identifier
    | Number
    | '(' expression ')'
    | StringLiteral
    ;

StringLiteral
    : '"' (~["\\] | '\\' .)*? '"'
    ;

Identifier
    : [a-zA-Z_] [a-zA-Z0-9_]*
    ;

Number
    : [0-9]+
    ;

WS
    : [ \t\r\n]+ -> skip
    ;

COMMENT
    : '//' ~[\r\n]* -> skip
    ;
