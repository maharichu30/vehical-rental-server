import HostRequest from "../models/HostRequest.js"
import transporter from "../config/mail.js"
import User from "../models/User.js"


export const getHostRequests = async(req,res)=>{

 try{

  const requests = await HostRequest.find().populate("user","name email")

  res.json(requests)

 }catch(error){

  res.status(500).json({message:"Server error"})

 }

}

export const approveHost = async(req,res)=>{

 try{

  const request = await HostRequest.findById(req.params.id)

  const user = await User.findById(request.user)

  user.role = "owner"

  await user.save()

  request.status = "approved"

  await request.save()

  res.json({
   message:"User promoted to owner"
  })

 }catch(error){

  res.status(500).json({message:"Server error"})

 }

}

export const requestHost = async (req, res) => {

  try {

    const { name, email, mobile, message } = req.body

    // send email to admin

    await transporter.sendMail({

      from: process.env.EMAIL_USER,

      to: process.env.EMAIL_USER,   // admin email

      subject: "New Become Host Request",

      html: `
        <h2>New Host Request</h2>

        <p><b>Name:</b> ${name}</p>

        <p><b>Email:</b> ${email}</p>

        <p><b>Mobile:</b> ${mobile}</p>

        <p><b>Message:</b> ${message}</p>

        <hr/>

        <p>User ID: ${req.user._id}</p>
      `

    })

    res.json({
      message: "Host request sent to admin successfully"
    })

  } catch (error) {

    console.log(error)

    res.status(500).json({
      message: "Server error"
    })

  }

}