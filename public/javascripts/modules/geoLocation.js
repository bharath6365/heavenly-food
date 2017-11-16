function getCoordinates(input,latInput,longInput) {
  // If no address return the function 
  if (!input) return;
  console.log(input, latInput, longInput);
  const dropdown = new google.maps.places.Autocomplete(input);
  dropdown.addListener('place_changed',() => {
      const place = dropdown.getPlace();
      latInput.value = place.geometry.location.lat();
      longInput.value = place.geometry.location.lng();
  })
  input.on('keypress', (e) => {
      if (e.keyCode === 13) {
          e.preventDefault();
      }
   })

}
export default getCoordinates;