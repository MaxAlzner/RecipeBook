
USE `RecipeBook`;

INSERT INTO Recipe(RecipeId, UniqueId, `Name`, PrepTime, CookTime, TotalTime, Servings, Calories, Notes, Revision, CreateDate)
VALUES
	(1, UUID(), 'Pecan Pie', 15, 40, 65, 8, 313, 'Aluminum foil can be used to keep food moist, cook it evenly, and make clean-up easier.', 1, NOW());

INSERT INTO Ingredient(RecipeId, `Name`, Unit, Quantity, Section)
VALUES
	(1, 'light brown sugar', 'CUP', 1, NULL),
	(1, 'white sugar', 'CUP', 0.25, NULL),
	(1, 'butter', 'CUP', 0.5, NULL),
	(1, 'eggs', 'CUP', 2, NULL),
	(1, 'all-purpose flour', 'CUP', 1, NULL),
	(1, 'milk', 'TBSP', 1, NULL),
	(1, 'vanilla extract', 'TSP', 1, NULL),
	(1, 'chopped pecans', 'CUP', 1, NULL);

INSERT INTO Direction(RecipeId, Step, Description)
VALUES
	(1, 1, 'Preheat oven to 400 degrees F (205 degrees C).'),
	(1, 2, 'In a large bowl, beat eggs until foamy, and stir in melted butter. Stir in the brown sugar, white sugar and the flour; mix well. Last add the milk, vanilla and nuts.'),
	(1, 3, 'Pour into an unbaked 9-in pie shell. Bake in preheated oven for 10 minutes at 400 degrees, then reduce temperature to 350 degrees and bake for 30 to 40 minutes, or until done.');
