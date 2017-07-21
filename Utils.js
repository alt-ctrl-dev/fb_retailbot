class Utils {

    static sendEmail(emailSubject, emailContent) {
        console.log(`sending email: ${emailSubject} - ${emailContent}`)
    }

    static isDefined(obj) {
        if (typeof obj == 'undefined') {
            return false;
        }
        
        if (!obj) {
            return false;
        }

        return obj != null;
    }
}

module.exports = Utils;