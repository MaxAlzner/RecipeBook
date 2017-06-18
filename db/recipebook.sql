CREATE DATABASE IF NOT EXISTS `RecipeBook` /*!40100 DEFAULT CHARACTER SET utf8 */;

USE `RecipeBook`;

DROP TABLE IF EXISTS Ingredient;
DROP TABLE IF EXISTS Direction;
DROP TABLE IF EXISTS Recipe;
DROP TABLE IF EXISTS Unit;

CREATE TABLE Unit
(
	`Code` VARCHAR(4) NOT NULL,
	`Name` VARCHAR(64) NOT NULL,
    ShortName VARCHAR(32) NOT NULL,
    
    CONSTRAINT PK_Code PRIMARY KEY(`Code`)
);

INSERT INTO Unit(`Code`, `Name`, ShortName)
VALUES
	('EA', 'Each', 'Each'),
    ('ML', 'Millilitre', 'Millilitre'),
    ('L', 'Litre', 'Litre'),
	('CUP', 'US Cup', 'Cup'),
	('TSP', 'US Teaspoon', 'Teaspoon'),
	('TBSP', 'US Tablespoon', 'Tablespoon'),
    ('FLOZ', 'US Fluid Ounce', 'FL Ounce'),
    ('PT', 'US Fluid Pint', 'Pint'),
    ('QT', 'US Fluid Quart', 'Quart'),
    ('GAL', 'US Fluid Gallon', 'Gallon');

CREATE TABLE Recipe
(
	RecipeId INT NOT NULL AUTO_INCREMENT,
    UniqueId VARCHAR(38) NOT NULL,
    `Name` VARCHAR(256) NOT NULL,
    PrepTime INT NULL,
    CookTime INT NULL,
    TotalTime INT NULL,
    Servings INT NULL,
    Calories INT NULL,
    Notes VARCHAR(1024) NULL,
    Revision INT NOT NULL,
    CreateDate DATETIME NOT NULL DEFAULT NOW(),
    
    CONSTRAINT PK_Recipe PRIMARY KEY (RecipeId),
    CONSTRAINT CHK_TotalTime CHECK (
		((TotalTime IS NOT NULL AND (PrepTime IS NOT NULL OR CookTime IS NOT NULL)) OR
		(TotalTime IS NULL AND PrepTime IS NULL AND CookTime IS NULL)) AND
        (TotalTime = (PrepTime + CookTime))
	)
);

CREATE TABLE Ingredient
(
	IngredientId INT NOT NULL AUTO_INCREMENT,
    RecipeId INT NOT NULL,
    `Name` VARCHAR(256) NOT NULL,
    UnitCode VARCHAR(4) NOT NULL,
    Quantity DECIMAL(8,4) NOT NULL,
    Section VARCHAR(64) NULL,
    
    CONSTRAINT PK_Ingredient PRIMARY KEY (IngredientId),
    CONSTRAINT FK_Ingredient_Recipe FOREIGN KEY (RecipeId) REFERENCES Recipe(RecipeId) ON DELETE CASCADE,
    CONSTRAINT FK_Ingredient_Unit FOREIGN KEY (UnitCode) REFERENCES Unit(`Code`)
);

CREATE TABLE Direction
(
	DirectionId INT NOT NULL AUTO_INCREMENT,
    RecipeId INT NOT NULL,
    Step INT NOT NULL,
    Description VARCHAR(1024) NOT NULL,
    
    CONSTRAINT PK_Direction PRIMARY KEY (DirectionId),
    CONSTRAINT FK_DirectionDirectionDirection_Recipe FOREIGN KEY (RecipeId) REFERENCES Recipe(RecipeId) ON DELETE CASCADE,
    CONSTRAINT UNQ_RecipeStep UNIQUE KEY (RecipeId, Step)
);
