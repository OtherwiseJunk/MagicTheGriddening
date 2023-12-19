export default function HeaderSquare(props: {text: string, imageSource: string, imageAltText:string}){
    let imageBlock
    if(props.imageSource){
        imageBlock = <img 
        className="logo bordered top-left top-right bottom-left bottom-right break-all"
        alt={props.imageAltText}
        src={props.imageSource}
        width={64}
        height={64}
        sizes="(mid-width: 66em) 64px,
        (min-width:44em) 32px
        (min-width:22em) 16px
        8px"
      />
    }
       
    return(
        <div className="p-2 m-auto">
        {imageBlock}
        {props.text}
      </div>
    )
}