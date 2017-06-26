
USE `RecipeBook`;

INSERT INTO User(UserId, `Name`, CreatedAt)
VALUES
    (1, 'System', NOW());

INSERT INTO Unit(`Code`, `Name`, ShortName)
VALUES
	('EA', 'Each', 'Each'),
    ('ML', 'Millilitre', 'Millilitre'),
    ('L', 'Litre', 'Litre'),
    ('G', 'Gram', 'Gram'),
    ('KG', 'Kilogram', 'Kilogram'),
	('CUP', 'US Cup', 'Cup'),
	('TSP', 'US Teaspoon', 'Teaspoon'),
	('TBSP', 'US Tablespoon', 'Tablespoon'),
    ('FLOZ', 'US Fluid Ounce', 'FL Ounce'),
    ('PT', 'US Fluid Pint', 'Pint'),
    ('QT', 'US Fluid Quart', 'Quart'),
    ('GAL', 'US Fluid Gallon', 'Gallon'),
    ('LB', 'US Pound', 'Pound');


INSERT INTO Recipe(RecipeId, UniqueId, `Name`, PrepTime, CookTime, TotalTime, Servings, Calories, Notes, Revision, CreatedAt, CreatedBy)
VALUES
	(1, UUID(), 'Pecan Pie', 15, 40, 65, 8, 313, 'Aluminum foil can be used to keep food moist, cook it evenly, and make clean-up easier.', 1, NOW(), 1);
INSERT INTO Ingredient(RecipeId, `Name`, UnitCode, Quantity, Section)
VALUES
	(1, 'light brown sugar', 'CUP', '1', NULL),
	(1, 'white sugar', 'CUP', '1/4', NULL),
	(1, 'butter', 'CUP', '1/2', NULL),
	(1, 'eggs', 'EA', '2', NULL),
	(1, 'all-purpose flour', 'CUP', '1', NULL),
	(1, 'milk', 'TBSP', '1', NULL),
	(1, 'vanilla extract', 'TSP', '1', NULL),
	(1, 'chopped pecans', 'CUP', '1', NULL);
INSERT INTO Direction(RecipeId, Step, Description)
VALUES
	(1, 1, 'Preheat oven to 400 degrees F (205 degrees C).'),
	(1, 2, 'In a large bowl, beat eggs until foamy, and stir in melted butter. Stir in the brown sugar, white sugar and the flour; mix well. Last add the milk, vanilla and nuts.'),
	(1, 3, 'Pour into an unbaked 9-in pie shell. Bake in preheated oven for 10 minutes at 400 degrees, then reduce temperature to 350 degrees and bake for 30 to 40 minutes, or until done.');


INSERT INTO Recipe(RecipeId, UniqueId, `Name`, PrepTime, CookTime, TotalTime, Servings, Calories, Notes, Revision, CreatedAt, CreatedBy)
VALUES
    (2, UUID(), 'Butter Flaky Pie Crust', 15, NULL, 15, 8, 173, 'Aluminum foil can be used to keep food moist, cook it evenly, and make clean-up easier.', 1, NOW(), 1);
INSERT INTO Ingredient(RecipeId, `Name`, UnitCode, Quantity, Section)
VALUES
	(2, 'all-purpose flour', 'CUP', '1 1/4', NULL),
    (2, 'salt', 'TSP', '1/4', NULL),
    (2, 'butter, chilled and diced', 'CUP', '1/2', NULL),
    (2, 'ice water', 'CUP', '1/4', NULL);
INSERT INTO Direction(RecipeId, Step, Description)
VALUES
	(2, 1, 'In a large bowl, combine flour and salt. Cut in butter until mixture resembles coarse crumbs. Stir in water, a tablespoon at a time, until mixture forms a ball. Wrap in plastic and refrigerate for 4 hours or overnight.'),
    (2, 2, 'Roll dough out to fit a 9 inch pie plate. Place crust in pie plate. Press the dough evenly into the bottom and sides of the pie plate.');


INSERT INTO Recipe(RecipeId, UniqueId, `Name`, PrepTime, CookTime, TotalTime, Servings, Calories, Notes, Revision, CreatedAt, CreatedBy)
VALUES
    (3, UUID(), 'Bran Muffins', 20, 20, 40, 12, 167, NULL, 1, NOW());
INSERT INTO Ingredient(RecipeId, `Name`, UnitCode, Quantity, Section)
VALUES
	(3, 'wheat bran', 'CUP', '1 1/2', NULL),
    (3, 'buttermilk', 'CUP', '1', NULL),
    (3, 'vegetable oil', 'CUP', '1/3', NULL),
	(3, 'eggs', 'EA', '1', NULL),
    (3, 'brown sugar', 'CUP', '2/3', NULL),
    (3, 'vanilla extract', 'TSP', '1/2', NULL),
    (3, 'all-purpose flour', 'CUP', '1', NULL),
    (3, 'baking soda', 'TSP', '1', NULL),
    (3, 'baking powder', 'TSP', '1', NULL),
    (3, 'salt', 'TSP', '1/2', NULL),
    (3, 'raisins', 'CUP', '1/2', NULL);
INSERT INTO Direction(RecipeId, Step, Description)
VALUES
	(3, 1, 'Preheat oven to 375 degrees F (190 degrees C). Grease muffin cups or line with paper muffin liners.'),
    (3, 2, 'Mix together wheat bran and buttermilk; let stand for 10 minutes.'),
    (3, 3, 'Beat together oil, egg, sugar and vanilla and add to buttermilk/bran mixture. Sift together flour, baking soda, baking powder and salt. Stir flour mixture into buttermilk mixture, until just blended. Fold in raisins and spoon batter into prepared muffin tins.'),
    (3, 4, 'Bake for 15 to 20 minutes, or until a toothpick inserted into the center of a muffin comes out clean. Cool and enjoy!');


INSERT INTO Recipe(RecipeId, UniqueId, `Name`, PrepTime, CookTime, TotalTime, Servings, Calories, Notes, Revision, CreatedAt, CreatedBy)
VALUES
    (4, UUID(), 'Banana Bread', 15, 65, 120, 12, 229, 'Aluminum foil can be used to keep food moist, cook it evenly, and make clean-up easier.', 1, NOW(), 1);
INSERT INTO Ingredient(RecipeId, `Name`, UnitCode, Quantity, Section)
VALUES
	(4, 'all-purpose flour', 'CUP', '2', NULL),
    (4, 'baking soda', 'TSP', '1', NULL),
    (4, 'salt', 'TSP', '1', NULL),
    (4, 'butter', 'CUP', '1/2', NULL),
    (4, 'brown sugar', 'CUP', '3/4', NULL),
    (4, 'eggs, beaten', 'EA', '2', NULL),
    (4, 'mashed overripe bananas', 'CUP', '2 1/3', NULL);
INSERT INTO Direction(RecipeId, Step, Description)
VALUES
	(4, 1, 'Preheat oven to 350 degrees F (175 degrees C). Lightly grease a 9x5 inch loaf pan.'),
    (4, 2, 'In a large bowl, combine flour, baking soda and salt. In a separate bowl, cream together butter and brown sugar. Stir in eggs and mashed bananas until well blended. Stir banana mixture into flour mixture; stir just to moisten. Pour batter into prepared loaf pan.'),
    (4, 3, 'Bake in preheated oven for 60 to 65 minutes, until a toothpick inserted into center of the loaf comes out clean. Let bread cool in pan for 10 minutes, then turn out onto a wire rack.');


INSERT INTO Recipe(RecipeId, UniqueId, `Name`, PrepTime, CookTime, TotalTime, Servings, Calories, Notes, Revision, CreatedAt, CreatedBy)
VALUES
	(5, UUID(), 'Brownies', 25, 35, 60, 16, 183, NULL, 1, NOW(), 1);
INSERT INTO Ingredient(RecipeId, `Name`, UnitCode, Quantity, Section)
VALUES
	(5, 'butter', 'CUP', '1/2', NULL),
    (5, 'white sugar', 'CUP', '1', NULL),
    (5, 'eggs', 'EA', '2', NULL),
    (5, 'vanilla extract', 'TSP', '1', NULL),
    (5, 'unsweetened cocoa powder', 'CUP', '1/3', NULL),
    (5, 'all-purpose flour', 'CUP', '1/2', NULL),
    (5, 'salt', 'TSP', '1/4', NULL),
    (5, 'baking powder', 'TSP', '1/4', NULL),
    (5, 'butter, softened', 'TBSP', '3', 'Frosting'),
    (5, 'unsweetened cocoa powder', 'TBSP', '3', 'Frosting'),
    (5, 'honey', 'TBSP', '1', 'Frosting'),
    (5, 'vanilla extract', 'TSP', '1', 'Frosting'),
    (5, 'confectioners\' sugar', 'CUP', '1', 'Frosting');
INSERT INTO Direction(RecipeId, Step, Description)
VALUES
	(5, 1, 'Preheat oven to 350 degrees F (175 degrees C). Grease and flour an 8-inch square pan.'),
	(5, 2, 'In a large saucepan, melt 1/2 cup butter. Remove from heat, and stir in sugar, eggs, and 1 teaspoon vanilla. Beat in 1/3 cup cocoa, 1/2 cup flour, salt, and baking powder. Spread batter into prepared pan.'),
	(5, 3, 'Bake in preheated oven for 25 to 30 minutes. Do not overcook.'),
	(5, 4, 'To Make Frosting: Combine 3 tablespoons softened butter, 3 tablespoons cocoa, honey, 1 teaspoon vanilla extract, and 1 cup confectioners\' sugar. Stir until smooth. Frost brownies while they are still warm.');
