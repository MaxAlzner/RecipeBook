CREATE DATABASE IF NOT EXISTS `RecipeBook` /*!40100 DEFAULT CHARACTER SET utf8 */;

USE `RecipeBook`;

DROP TABLE IF EXISTS Password;
DROP TABLE IF EXISTS User;

CREATE TABLE User
(
    UserId INT NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(128) NOT NULL,
    CreatedAt DATETIME NOT NULL,
    LastUpdated DATETIME NULL,
    LastLogIn DATETIME NULL,
    
    CONSTRAINT PK_User PRIMARY KEY (UserId),
    CONSTRAINT UNQ_UserName UNIQUE KEY (`Name`)
);

CREATE TABLE Password
(
    PasswordId INT NOT NULL,
    UserId INT NOT NULL,
    Hash VARCHAR(128) NULL,
    Salt VARCHAR(64) NULL,
    CreatedAt DATETIME NOT NULL,
    
    CONSTRAINT PK_Password PRIMARY KEY (PasswordId),
    CONSTRAINT FK_Password_User FOREIGN KEY (UserId) REFERENCES User(UserId) ON DELETE CASCADE
);

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
    CreatedAt DATETIME NOT NULL,
    CreatedBy INT NOT NULL,
    
    CONSTRAINT PK_Recipe PRIMARY KEY (RecipeId),
    CONSTRAINT FK_Recipe_User FOREIGN KEY (CreatedBy) REFERENCES User(UserId),
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
    Quantity VARCHAR(16) NOT NULL,
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
