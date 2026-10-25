import Hero from "../components/home/Hero";
import About from "../components/home/About";
import Skills from "../components/home/Skills";
import Education from "../components/home/Education";
import Process from "../components/home/Process";
import Projects from "../components/home/Projects";
import CreativeLabSection from "../components/home/CreativeLabSection";
import Contact from "../components/home/Contact";

// Galaxy intro → 3D name hero → about → skills → education → how I work → work → creative lab → contact
export default function Home() {
  return (
    <main className="home">
      <Hero />
      <About />
      <Skills />
      <Education />
      <Process />
      <Projects />
      <CreativeLabSection />
      <Contact />
    </main>
  );
}
