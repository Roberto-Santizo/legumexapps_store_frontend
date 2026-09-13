import { HeroSection } from "@/feature/home/component/heroSection.component"
import { StatBand } from "@/feature/home/component/statBand.component"
import { ProductLinesSection } from "@/feature/home/component/productLinesSection.component"
import { MarqueeStrip } from "@/feature/home/component/marqueeStrip.component"
import { LeadCaptureSection } from "@/feature/home/component/leadCaptureSection.component"

export function HomePage() {
    return (
        <>
            <HeroSection />
            <StatBand />
            <ProductLinesSection />
            <MarqueeStrip />
            <LeadCaptureSection />
        </>
    )
}
