//------------------------------------------------------------------------------
// <auto-generated>
//    This code was generated from a template.
//
//    Manual changes to this file may cause unexpected behavior in your application.
//    Manual changes to this file will be overwritten if the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace LibRecipeBook
{
    using System;
    using System.Collections.Generic;
    
    public partial class Ingredient
    {
        public int IngredientId { get; set; }
        public int RecipeId { get; set; }
        public string Name { get; set; }
        public string UnitCode { get; set; }
        public decimal Quantity { get; set; }
        public string Section { get; set; }
    
        public virtual Recipe Recipe { get; set; }
        public virtual Unit Unit { get; set; }
    }
}
