import React from "react";
import "./AboutUs.css";
import childonglasses from "../../assets/images/childonglasses.jpg";
import pencils from "../../assets/images/pencils.jpg";
import crayons from "../../assets/images/crayons.jpg";

interface AboutUsProps {
  showCta?: boolean;
}

const AboutUs: React.FC<AboutUsProps> = () => {
  return (
    <section className="about-page">
      {/* Who We Are */}
      <div className="about-section">
        <div className="about-image-first-div">
          <div className="about-image">
            <img src={childonglasses} alt="About Iyare Learning Hub" />
          </div>
        </div>
        <div className="about-text">
          <h3 style={{ color: "#023009" }}>Who We Are</h3>
          <p>
            Iyare Learning Hub is a community-driven education initiative
            committed to unlocking opportunities for learners across all ages in
            Nigeria and beyond.
            <br />
            <br />
            We believe in providing accessible, inclusive, and empowering
            education that builds confidence, skills, and a lifelong love for
            learning. At Iyare, we combine innovation, mentorship, and cultural
            pride to foster growth and transformation in every learner.
          </p>
        </div>
      </div>

      {/* Our Mission */}
      <div className="about-section-reverse">
        <div className="about-text">
          <h3 style={{ color: "#FFD000" }}>Our Mission</h3>
          <p style={{ color: "#FFD000" }}>
            Our mission is to nurture a generation of bold thinkers, creators,
            and leaders by offering learning programs tailored to real-world
            challenges and opportunities.
            <br />
            <br />
            From foundational literacy to technology skills, we equip learners
            with the knowledge, support, and confidence to thrive in today’s
            fast-paced world. Through partnerships, community engagement, and
            inclusive access, we’re shaping futures, one mind at a time.
          </p>
        </div>

        <div className="about-image-first-div">
          <div className="about-image">
            <img src={pencils} alt="Our Mission" />
          </div>
        </div>
      </div>

      {/* Our Vision */}
      <div className="about-section">
        <div className="about-image-first-div">
          <div className="about-image">
            <img src={crayons} alt="Our Vision" />
          </div>
        </div>

        <div className="about-text">
          <h3 style={{ color: "#023009" }}>Our Vision</h3>
          <p>
            We envision a world where every learner—regardless of background—has
            the tools and confidence to reach their full potential.
            <br />
            <br />
            At Iyare Learning Hub, we see a future of empowered communities, led
            by educated, inspired, and culturally grounded individuals who
            contribute meaningfully to society and innovation in Africa.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
