import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";

const changeAvailability = async (req, res) => {
  try {
    const { docId } = req.body;
    const docData = await doctorModel.findById(docId);
    await doctorModel.findByIdAndUpdate(docId, {
      available: !docData.available,
    });
    res.json({ success: true, message: "Availability changed successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const doctorList = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select(["-password", "-email"]);
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API TO GET DOCTOR APPOINTMENT FOR DOCTOR PANEL
const appointmentsDoctor = async(req,res)=>{
  try {
    const { docId }= req.body 
    const appointments = await appointmentModel.find({ docId })
    res.json({ success: true, appointments})  
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
    
  }
}


export { changeAvailability, doctorList , appointmentsDoctor};
