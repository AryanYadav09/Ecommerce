import React from 'react'
import Hero from '../components/Hero'
import LatestCollection from '../components/LatestCollection.jsx'
import BestSellers from '../components/BestSellers.jsx'
import OurPolicy from '../components/OurPolicy.jsx'
import NewsLetterBox from '../components/NewsLetterBox.jsx'

const Home = () => {
  return (
    <div>
      <Hero/>
      <LatestCollection/>
      <BestSellers/>
      <OurPolicy/>
      <NewsLetterBox/>
      
    </div>
  )
}

export default Home
