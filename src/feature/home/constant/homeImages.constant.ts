// Imágenes de stock (Unsplash + Openverse/Flickr, todas de uso libre) usadas como placeholder de
// alta calidad mientras se conectan las fotos reales del catálogo/S3. Centralizadas acá a
// propósito: para reemplazarlas por las fotos definitivas del cliente basta con cambiar estas
// URLs, sin tocar los componentes.
//
// Nota de licencias: las de Unsplash no requieren atribución (uso comercial libre). Las dos
// marcadas "Openverse" son CC BY / CC BY-SA (Flickr) -- si esta landing sale a producción tal
// cual, agregar el crédito correspondiente o, mejor, reemplazarlas por fotos propias.

function unsplash(id: string, width: number) {
    return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`
}

export const HOME_IMAGES = {
    heroBackground: unsplash("photo-1500937386664-56d1dfef3854", 2400), // Campo de trigo dorado, atardecer
    aboutField: unsplash("photo-1500382017468-9049fed747ef", 1400), // Campo de cultivo dorado al atardecer
} as const

export const PRODUCT_LINE_IMAGES = {
    fresh: unsplash("photo-1518843875459-f738682238a6", 1400),
    // Openverse/Flickr, CC BY-SA: https://www.flickr.com/photos/veganbaking/2270449596
    frozen: "https://live.staticflickr.com/2245/2270449596_3abf8e39a5_b.jpg",
    hpp: unsplash("photo-1622597467836-f3285f2131b8", 1400),
    // Openverse/Flickr, CC BY: "oven-baked veggie chips"
    healthySnacks: "https://live.staticflickr.com/65535/54493175939_e4b38d1bcb_b.jpg",
    shelfStable: unsplash("photo-1578916171728-46686eac8d58", 1400),
    foodService: unsplash("photo-1552566626-52f8b828add9", 1400),
    privateLabel: unsplash("photo-1607349913338-fca6f7fc42d0", 1400),
} as const

export type ProductLineImageKey = keyof typeof PRODUCT_LINE_IMAGES
