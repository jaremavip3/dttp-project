import * as React from "react"
import { Card as ShadcnCard, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"

const ProductCard = React.forwardRef(({ 
  className,
  product,
  showBadges = true,
  linkHref,
  ...props 
}, ref) => {
  const CardWrapper = linkHref ? Link : 'div'
  const cardProps = linkHref ? { href: linkHref } : {}

  return (
    <CardWrapper {...cardProps} className={linkHref ? "group cursor-pointer" : ""}>
      <ShadcnCard 
        ref={ref}
        className={cn(
          "overflow-hidden transition-all duration-300 hover:shadow-lg",
          linkHref && "group-hover:scale-[1.02]",
          className
        )}
        {...props}
      >
        <div className="aspect-square relative overflow-hidden bg-gray-100">
          <Image
            src={product.image || product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {showBadges && (
            <div className="absolute top-3 left-3 right-3 flex justify-between">
              {product.isNew && (
                <Badge variant="secondary" className="bg-black text-white">
                  New
                </Badge>
              )}
              {product.isBestSeller && (
                <Badge variant="secondary" className="bg-blue-600 text-white">
                  Best Seller
                </Badge>
              )}
              {product.isOnSale && (
                <Badge variant="destructive" className="ml-auto">
                  Sale
                </Badge>
              )}
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <CardTitle className="text-base font-medium text-gray-900 mb-2 group-hover:text-gray-600 transition-colors">
            {product.name}
          </CardTitle>
          
          {product.category && (
            <CardDescription className="text-sm text-gray-500 mb-2">
              {product.category}
            </CardDescription>
          )}
          
          <div className="flex justify-center gap-2">
            {product.isOnSale && product.originalPrice ? (
              <>
                <span className="text-gray-500 line-through text-sm">
                  ${product.originalPrice}
                </span>
                <span className="text-red-600 font-medium">
                  ${product.price}
                </span>
              </>
            ) : (
              <span className="text-gray-900 font-medium">
                ${product.price || '29.99'}
              </span>
            )}
          </div>
        </CardContent>
      </ShadcnCard>
    </CardWrapper>
  )
})
ProductCard.displayName = "ProductCard"

export { ProductCard, ShadcnCard as Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }
