import React from 'react'
import Title from '../components/Title.jsx'
import { assets } from '../assets/assets.js'
import NewsLetterBox from '../components/NewsLetterBox.jsx'

const About = () => {
  return (
    <div >
      <div className='text-2xl text-center pt-8 border-t' >

        <Title text1={'ABOUT'} text2={'US'}  />

      </div>

      <div className='my-10 flex flex-col md:flex-row gap-16' >
        <img className='w-full md:max-w-[450px]' src={assets.about_img} alt="" />
        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-gray-600' >

          <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Temporibus fugit odio eligendi unde quos incidunt laboriosam nihil porro itaque hic, facilis quibusdam? Quia nostrum porro veritatis eum, aspernatur quasi dolorum placeat provident aliquam delectus nam explicabo neque, pariatur non asperiores sed nobis optio? Corporis iusto inventore sequi aspernatur sapiente distinctio doloremque aliquid optio temporibus autem! Similique blanditiis, sapiente officia, temporibus tempora reiciendis itaque id magnam perferendis quidem quibusdam eius? Tenetur laborum maiores omnis, laudantium iusto optio excepturi?</p>
          <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Incidunt, rerum vel in iusto laboriosam explicabo distinctio dolorem natus ipsum omnis voluptas sint nesciunt, quia iure illum harum neque tempora illo tempore amet cum aperiam unde corporis? Ipsam minima quae nam veniam. Quaerat enim, sunt veritatis quidem consectetur cupiditate temporibus tenetur ex repellendus ratione amet rerum!</p>

          <b className='text-gray-800' >Our Mission</b>
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Doloribus nobis accusantium odio possimus, iusto perspiciatis alias ratione nesciunt quo commodi consequatur in consectetur cum corporis eos, ipsum voluptates. Explicabo obcaecati ex reprehenderit ipsam?</p>
        </div>

      </div>

      <div className='text-xl py-4 ' >
        <Title text1={'WHY'} text2={'CHOOSE US'} />

      </div>

      <div className='flex flex-col md:flex-row text-sm mb-20' >
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5' >
          <b>Quality Assurance:</b>
          <p className='text-gray-600'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempora, quisquam dolorem.</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5' >
          <b>Convenience:</b>
          <p className='text-gray-600'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Magni, corrupti.</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5' >
          <b>Exceptional Customer Service:</b>
          <p className='text-gray-600'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Magni, corrupti.</p>
        </div>
      </div>

      <NewsLetterBox/>
      
    </div>
  )
}

export default About
