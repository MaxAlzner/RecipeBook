using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Fractions;

namespace LibRecipeBook
{
    public partial class Ingredient
    {
        public Fraction QuantityFraction
        {
            get
            {
                var q = Fraction.FromDecimal(this.Quantity);

                if (q.Denominator == 10000)
                {
                    var whole = Math.Truncate(this.Quantity);
                    if ((this.Quantity - whole) == 0.3333m)
                    {
                        q = new Fraction(((int)whole * 3) + 1, 3);
                    }
                    else if ((this.Quantity - whole) == 0.6667m)
                    {
                        q = new Fraction(((int)whole * 3) + 2, 3);
                    }
                }

                return q;
            }
        }
    }
}
